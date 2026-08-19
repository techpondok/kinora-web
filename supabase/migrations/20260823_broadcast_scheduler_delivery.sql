-- Kinora Broadcast scheduler, delivery tracking, and idempotent execution.

CREATE TABLE IF NOT EXISTS public.kinora_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  channels TEXT[] NOT NULL DEFAULT ARRAY['push', 'in_app']::TEXT[],
  target_audience JSONB NOT NULL DEFAULT '{"type":"all"}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  cta_label TEXT,
  cta_url TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  target_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  channel_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_error TEXT,
  processing_started_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kinora_broadcasts
  ADD COLUMN IF NOT EXISTS target_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivered_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opened_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS channel_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kinora_broadcasts_status_check'
      AND conrelid = 'public.kinora_broadcasts'::regclass
  ) THEN
    ALTER TABLE public.kinora_broadcasts
      ADD CONSTRAINT kinora_broadcasts_status_check
      CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'failed', 'cancelled', 'archived'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.kinora_broadcast_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.kinora_broadcasts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'in_app', 'email', 'banner')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_broadcast_delivery_user_channel_unique
  ON public.kinora_broadcast_deliveries(broadcast_id, user_id, channel)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_broadcast_delivery_global_channel_unique
  ON public.kinora_broadcast_deliveries(broadcast_id, channel)
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_broadcasts_due
  ON public.kinora_broadcasts(status, scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_broadcast
  ON public.kinora_broadcast_deliveries(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_user
  ON public.kinora_broadcast_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_status
  ON public.kinora_broadcast_deliveries(status);

CREATE OR REPLACE FUNCTION public.kinora_recount_broadcast_delivery(p_broadcast_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.kinora_broadcasts b
  SET
    target_count = COALESCE((
      SELECT count(DISTINCT user_id)::INTEGER
      FROM public.kinora_broadcast_deliveries
      WHERE broadcast_id = p_broadcast_id AND user_id IS NOT NULL
    ), 0),
    sent_count = COALESCE((
      SELECT count(*)::INTEGER
      FROM public.kinora_broadcast_deliveries
      WHERE broadcast_id = p_broadcast_id AND status IN ('sent', 'delivered', 'opened')
    ), 0),
    delivered_count = COALESCE((
      SELECT count(*)::INTEGER
      FROM public.kinora_broadcast_deliveries
      WHERE broadcast_id = p_broadcast_id AND status IN ('delivered', 'opened')
    ), 0),
    failed_count = COALESCE((
      SELECT count(*)::INTEGER
      FROM public.kinora_broadcast_deliveries
      WHERE broadcast_id = p_broadcast_id AND status = 'failed'
    ), 0),
    opened_count = COALESCE((
      SELECT count(*)::INTEGER
      FROM public.kinora_broadcast_deliveries
      WHERE broadcast_id = p_broadcast_id AND status = 'opened'
    ), 0),
    updated_at = now()
  WHERE b.id = p_broadcast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.execute_kinora_broadcast(p_broadcast_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_broadcast public.kinora_broadcasts%ROWTYPE;
  v_targets UUID[];
  v_target_count INTEGER := 0;
  v_channel TEXT;
  v_created INTEGER := 0;
  v_channel_results JSONB := '{}'::jsonb;
  v_warning TEXT := NULL;
BEGIN
  SELECT * INTO v_broadcast
  FROM public.kinora_broadcasts
  WHERE id = p_broadcast_id
    AND status IN ('draft', 'scheduled', 'processing', 'failed')
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Broadcast tidak ditemukan atau tidak dapat diproses');
  END IF;

  UPDATE public.kinora_broadcasts
  SET status = 'processing',
      processing_started_at = now(),
      last_error = NULL,
      updated_at = now()
  WHERE id = v_broadcast.id;

  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) INTO v_targets
  FROM auth.users;
  v_target_count := COALESCE(array_length(v_targets, 1), 0);

  RAISE LOG '[BROADCAST][CHECK] id=% title=% status=% scheduled_at=% now=% due=%',
    v_broadcast.id, v_broadcast.title, v_broadcast.status, v_broadcast.scheduled_at, now(),
    (v_broadcast.scheduled_at IS NULL OR v_broadcast.scheduled_at <= now());
  RAISE LOG '[BROADCAST][TIME] scheduled_at_utc=% server_now_utc=% timezone=Asia/Jakarta',
    v_broadcast.scheduled_at, now();
  RAISE LOG '[BROADCAST][CLAIM] id=% status=processing', v_broadcast.id;

  IF v_target_count = 0 THEN
    v_warning := 'No eligible recipients found.';
  END IF;

  FOREACH v_channel IN ARRAY v_broadcast.channels LOOP
    v_created := 0;

    IF v_channel IN ('push', 'in_app', 'email') THEN
      INSERT INTO public.kinora_broadcast_deliveries (
        broadcast_id, user_id, channel, status, sent_at, failure_reason, metadata
      )
      SELECT
        v_broadcast.id,
        target_id,
        v_channel,
        CASE WHEN v_channel = 'email' THEN 'failed' ELSE 'sent' END,
        CASE WHEN v_channel = 'email' THEN NULL ELSE now() END,
        CASE WHEN v_channel = 'email' THEN 'Email broadcast provider is not configured.' ELSE NULL END,
        jsonb_build_object('target_type', COALESCE(v_broadcast.target_audience->>'type', 'all'))
      FROM unnest(v_targets) AS target_id
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_created = ROW_COUNT;

      IF v_channel = 'in_app' THEN
        INSERT INTO public.kinora_notifications (user_id, title, body, type, is_read, action_url, metadata)
        SELECT
          target_id,
          v_broadcast.title,
          v_broadcast.body,
          'broadcast',
          false,
          v_broadcast.cta_url,
          jsonb_build_object('broadcast_id', v_broadcast.id, 'category', v_broadcast.category, 'priority', v_broadcast.priority)
        FROM unnest(v_targets) AS target_id;
      END IF;

      RAISE LOG '[BROADCAST][%] targets=% created=%', upper(v_channel), v_target_count, v_created;
      v_channel_results := jsonb_set(
        v_channel_results,
        ARRAY[v_channel],
        jsonb_build_object(
          'status', CASE WHEN v_channel = 'email' THEN 'failed' ELSE 'completed' END,
          'targets', v_target_count,
          'created', v_created
        ),
        true
      );
    ELSIF v_channel = 'banner' THEN
      INSERT INTO public.kinora_banners (
        title, description, image_url, label, button_text, button_link, placement,
        display_variant, audience, platform, is_active, start_at, end_at, metadata
      )
      SELECT
        v_broadcast.title,
        v_broadcast.body,
        v_broadcast.banner_url,
        upper(v_broadcast.category),
        v_broadcast.cta_label,
        v_broadcast.cta_url,
        'home_top',
        'card',
        COALESCE(v_broadcast.target_audience->>'type', 'all'),
        ARRAY['mobile', 'web']::TEXT[],
        true,
        now(),
        NULL,
        jsonb_build_object('broadcast_id', v_broadcast.id)
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.kinora_banners
        WHERE metadata->>'broadcast_id' = v_broadcast.id::TEXT
      );

      INSERT INTO public.kinora_broadcast_deliveries (
        broadcast_id, user_id, channel, status, sent_at, metadata
      ) VALUES (
        v_broadcast.id,
        NULL,
        'banner',
        'sent',
        now(),
        jsonb_build_object('target_type', COALESCE(v_broadcast.target_audience->>'type', 'all'))
      )
      ON CONFLICT DO NOTHING;

      RAISE LOG '[BROADCAST][BANNER] created_or_activated=true';
      v_channel_results := jsonb_set(
        v_channel_results,
        ARRAY['banner'],
        jsonb_build_object('status', 'completed', 'created_or_activated', true),
        true
      );
    END IF;
  END LOOP;

  PERFORM public.kinora_recount_broadcast_delivery(v_broadcast.id);

  UPDATE public.kinora_broadcasts
  SET status = 'completed',
      sent_at = COALESCE(sent_at, now()),
      completed_at = now(),
      channel_results = v_channel_results,
      last_error = v_warning,
      updated_at = now()
  WHERE id = v_broadcast.id;

  RAISE LOG '[BROADCAST][COMPLETE] id=% status=completed', v_broadcast.id;

  RETURN jsonb_build_object(
    'success', true,
    'broadcast_id', v_broadcast.id,
    'status', 'completed',
    'target_count', v_target_count,
    'warning', v_warning,
    'channel_results', v_channel_results
  );
EXCEPTION WHEN OTHERS THEN
  UPDATE public.kinora_broadcasts
  SET status = 'failed',
      last_error = SQLERRM,
      updated_at = now()
  WHERE id = p_broadcast_id;
  RAISE LOG '[BROADCAST][ERROR] id=% reason=%', p_broadcast_id, SQLERRM;
  RETURN jsonb_build_object('success', false, 'broadcast_id', p_broadcast_id, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.process_due_kinora_broadcasts(p_limit INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
  v_results JSONB := '[]'::jsonb;
  v_result JSONB;
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL AND NOT public.is_kinora_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authorized');
  END IF;

  FOR v_id IN
    SELECT id
    FROM public.kinora_broadcasts
    WHERE status = 'scheduled'
      AND scheduled_at <= now()
    ORDER BY scheduled_at ASC
    LIMIT COALESCE(p_limit, 10)
  LOOP
    v_result := public.execute_kinora_broadcast(v_id);
    v_results := v_results || jsonb_build_array(v_result);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'processed', jsonb_array_length(v_results), 'results', v_results);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.admin_execute_kinora_broadcast(p_broadcast_id UUID)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_kinora_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authorized');
  END IF;
  RETURN public.execute_kinora_broadcast(p_broadcast_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

ALTER TABLE public.kinora_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinora_broadcast_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage broadcasts" ON public.kinora_broadcasts;
CREATE POLICY "Admins manage broadcasts" ON public.kinora_broadcasts
FOR ALL TO authenticated
USING (public.is_kinora_admin())
WITH CHECK (public.is_kinora_admin());

DROP POLICY IF EXISTS "Admins read broadcast deliveries" ON public.kinora_broadcast_deliveries;
CREATE POLICY "Admins read broadcast deliveries" ON public.kinora_broadcast_deliveries
FOR SELECT TO authenticated
USING (public.is_kinora_admin());

DROP POLICY IF EXISTS "Users read own broadcast deliveries" ON public.kinora_broadcast_deliveries;
CREATE POLICY "Users read own broadcast deliveries" ON public.kinora_broadcast_deliveries
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kinora_broadcasts TO authenticated;
GRANT SELECT ON public.kinora_broadcast_deliveries TO authenticated;
REVOKE ALL ON FUNCTION public.execute_kinora_broadcast(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_due_kinora_broadcasts(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_execute_kinora_broadcast(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_due_kinora_broadcasts(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_due_kinora_broadcasts(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_execute_kinora_broadcast(UUID) TO authenticated;

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[BROADCAST][CRON] pg_cron extension unavailable: %', SQLERRM;
  END;

  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    BEGIN
      PERFORM cron.unschedule('kinora-process-due-broadcasts');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    PERFORM cron.schedule(
      'kinora-process-due-broadcasts',
      '* * * * *',
      'SELECT public.process_due_kinora_broadcasts(10);'
    );
    RAISE LOG '[BROADCAST][CRON] scheduled job kinora-process-due-broadcasts';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[BROADCAST][CRON] scheduler setup skipped: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
