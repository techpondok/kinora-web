-- Promo Free Access / Access Pass.
-- Adds calendar-month access grants, one-time duplicate protection, and
-- payment-free Family Plus entitlement via existing family subscription fields.

ALTER TABLE public.kinora_promo_codes
  ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'free'
    CHECK (access_type IN ('free', 'paid')),
  ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_duration_months INTEGER
    CHECK (access_duration_months IS NULL OR access_duration_months > 0);

ALTER TABLE public.kinora_promo_redemptions
  ADD COLUMN IF NOT EXISTS access_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;

ALTER TABLE public.kinora_families
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

UPDATE public.kinora_families
SET subscription_plan = COALESCE(subscription_plan, plan, 'free')
WHERE subscription_plan IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_kinora_promo_redemptions_user_promo_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_kinora_promo_redemptions_user_promo_unique
      ON public.kinora_promo_redemptions (user_id, promo_code_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.kinora_sync_promo_code_contract()
RETURNS trigger AS $$
DECLARE
  v_type TEXT;
BEGIN
  NEW.code := upper(trim(NEW.code));

  v_type := COALESCE(NULLIF(NEW.promo_type, ''), NULLIF(NEW.type, ''));
  IF v_type IS NULL OR v_type = 'trial' THEN
    IF NEW.access_plan IS NOT NULL
      OR NEW.access_duration_type IS NOT NULL
      OR NEW.access_duration_value IS NOT NULL
      OR NEW.access_duration_days IS NOT NULL
      OR NEW.access_duration_months IS NOT NULL
      OR NEW.access_lifetime = true THEN
      v_type := 'access_pass';
    ELSIF COALESCE(NEW.discount_percent, NEW.discount_percentage, 0) > 0 THEN
      v_type := 'discount';
    ELSE
      v_type := COALESCE(v_type, 'trial');
    END IF;
  END IF;

  NEW.type := v_type;
  NEW.promo_type := v_type;
  NEW.trial_days := CASE WHEN v_type = 'trial' THEN COALESCE(NEW.trial_days, 0) ELSE 0 END;
  NEW.redemption_count := COALESCE(NEW.redemption_count, NEW.total_redemptions, 0);
  NEW.total_redemptions := COALESCE(NEW.total_redemptions, NEW.redemption_count, 0);
  NEW.discount_percent := CASE
    WHEN v_type = 'discount' THEN COALESCE(NEW.discount_percent, NEW.discount_percentage, 0)
    ELSE 0
  END;
  NEW.discount_percentage := NEW.discount_percent;
  NEW.bonus_storage_bytes := COALESCE(NEW.bonus_storage_bytes, NEW.trial_bonus_storage_bytes, NEW.access_bonus_storage_bytes, 0);
  NEW.trial_bonus_storage_bytes := CASE WHEN v_type = 'trial' THEN NEW.bonus_storage_bytes ELSE 0 END;
  NEW.access_bonus_storage_bytes := CASE WHEN v_type = 'access_pass' THEN NEW.bonus_storage_bytes ELSE 0 END;
  NEW.access_type := CASE WHEN v_type = 'access_pass' THEN COALESCE(NEW.access_type, 'free') ELSE COALESCE(NEW.access_type, 'paid') END;
  NEW.requires_payment := CASE WHEN v_type = 'access_pass' AND NEW.access_type = 'free' THEN false ELSE COALESCE(NEW.requires_payment, true) END;
  NEW.access_lifetime := v_type = 'access_pass' AND (
    COALESCE(NEW.access_lifetime, false) = true OR NEW.access_duration_type = 'lifetime'
  );
  NEW.access_duration_type := CASE
    WHEN v_type = 'access_pass' AND NEW.access_lifetime THEN 'lifetime'
    WHEN v_type = 'access_pass' AND COALESCE(NEW.access_duration_months, 0) > 0 THEN 'months'
    WHEN v_type = 'access_pass' THEN COALESCE(NEW.access_duration_type, 'days')
    ELSE NEW.access_duration_type
  END;
  NEW.access_duration_days := CASE
    WHEN v_type = 'access_pass' AND NEW.access_lifetime = false AND NEW.access_duration_type = 'days'
      THEN COALESCE(NEW.access_duration_days, NEW.access_duration_value)
    ELSE NULL
  END;
  NEW.access_duration_months := CASE
    WHEN v_type = 'access_pass' AND NEW.access_lifetime = false AND NEW.access_duration_type = 'months'
      THEN COALESCE(NEW.access_duration_months, NEW.access_duration_value)
    ELSE NULL
  END;
  NEW.access_duration_value := CASE
    WHEN v_type = 'access_pass' AND NEW.access_duration_type = 'months' THEN NEW.access_duration_months
    WHEN v_type = 'access_pass' AND NEW.access_duration_type = 'days' THEN NEW.access_duration_days
    ELSE NEW.access_duration_value
  END;
  NEW.notes := COALESCE(NEW.notes, NEW.internal_notes);
  NEW.internal_notes := COALESCE(NEW.internal_notes, NEW.notes);
  NEW.one_time_per_user := COALESCE(NEW.one_time_per_user, NEW.redemption_rule IS DISTINCT FROM 'unlimited_per_user', true);
  NEW.redemption_rule := CASE WHEN NEW.one_time_per_user THEN 'once_per_user' ELSE 'unlimited_per_user' END;
  NEW.redemption_limit_type := CASE WHEN NEW.max_redemptions IS NULL THEN 'unlimited' ELSE 'limited' END;
  NEW.updated_at := now();

  IF NEW.type = 'trial' AND NEW.trial_days <= 0 THEN
    RAISE EXCEPTION 'Trial Days is required for Trial promo.';
  END IF;
  IF NEW.type = 'access_pass' AND NEW.access_lifetime = false
    AND COALESCE(NEW.access_duration_days, NEW.access_duration_months, 0) <= 0 THEN
    RAISE EXCEPTION 'Access Duration is required.';
  END IF;
  IF NEW.type = 'discount' AND (NEW.discount_percent <= 0 OR NEW.discount_percent > 100) THEN
    RAISE EXCEPTION 'Discount percentage must be between 1%% and 100%%.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.redeem_kinora_promo(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_promo public.kinora_promo_codes%ROWTYPE;
  v_started_at TIMESTAMPTZ := now();
  v_existing_expires_at TIMESTAMPTZ;
  v_base_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_family_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'unauthenticated', 'message', 'Promo tidak berlaku untuk akun ini');
  END IF;

  SELECT * INTO v_promo
  FROM public.kinora_promo_codes
  WHERE lower(code) = lower(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Promo tidak ditemukan');
  END IF;
  IF NOT v_promo.is_active THEN
    RETURN jsonb_build_object('success', false, 'code', 'inactive', 'message', 'Promo sudah tidak aktif');
  END IF;
  IF v_promo.starts_at IS NOT NULL AND now() < v_promo.starts_at THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_started', 'message', 'Promo belum dimulai');
  END IF;
  IF v_promo.expires_at IS NOT NULL AND now() > v_promo.expires_at THEN
    RETURN jsonb_build_object('success', false, 'code', 'expired', 'message', 'Promo sudah kedaluwarsa');
  END IF;
  IF v_promo.one_time_per_user AND EXISTS (
    SELECT 1 FROM public.kinora_promo_redemptions
    WHERE promo_code_id = v_promo.id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_redeemed', 'message', 'Promo ini sudah pernah digunakan.');
  END IF;
  IF v_promo.max_redemptions IS NOT NULL AND v_promo.redemption_count >= v_promo.max_redemptions THEN
    RETURN jsonb_build_object('success', false, 'code', 'limit_reached', 'message', 'Promo quota reached');
  END IF;

  IF v_promo.type = 'access_pass' AND (v_promo.access_type = 'free' OR v_promo.requires_payment = false) THEN
    SELECT f.id, f.subscription_expires_at INTO v_family_id, v_existing_expires_at
    FROM public.kinora_families f
    WHERE f.owner_id = v_user_id
    ORDER BY f.created_at ASC
    LIMIT 1
    FOR UPDATE;

    v_base_at := GREATEST(v_started_at, COALESCE(v_existing_expires_at, v_started_at));
    IF v_promo.access_lifetime THEN
      v_expires_at := NULL;
    ELSIF COALESCE(v_promo.access_duration_months, 0) > 0 THEN
      v_expires_at := v_base_at + make_interval(months => v_promo.access_duration_months);
    ELSE
      v_expires_at := v_base_at + make_interval(days => v_promo.access_duration_days);
    END IF;

    IF v_family_id IS NOT NULL THEN
      UPDATE public.kinora_families
      SET plan = COALESCE(v_promo.access_plan, 'family_plus'),
          subscription_plan = COALESCE(v_promo.access_plan, 'family_plus'),
          subscription_expires_at = v_expires_at,
          updated_at = now()
      WHERE id = v_family_id;
    END IF;
  END IF;

  INSERT INTO public.kinora_promo_redemptions (
    promo_code_id, promo_id, promo_code, user_id, family_id, benefit_type, benefit_value,
    status, trial_days, discount_percent, bonus_storage_bytes, access_started_at,
    access_expires_at, metadata
  ) VALUES (
    v_promo.id, v_promo.id, v_promo.code, v_user_id, v_family_id, v_promo.type,
    CASE
      WHEN v_promo.type = 'access_pass' THEN COALESCE(v_promo.access_duration_months::TEXT, v_promo.access_duration_days::TEXT, 'lifetime')
      WHEN v_promo.type = 'trial' THEN v_promo.trial_days::TEXT
      WHEN v_promo.type = 'discount' THEN v_promo.discount_percent::TEXT
      ELSE ''
    END,
    CASE WHEN v_promo.type = 'access_pass' THEN 'active' ELSE 'redeemed' END,
    v_promo.trial_days, v_promo.discount_percent, v_promo.bonus_storage_bytes,
    CASE WHEN v_promo.type = 'access_pass' THEN v_started_at ELSE NULL END,
    CASE WHEN v_promo.type = 'access_pass' THEN v_expires_at ELSE NULL END,
    jsonb_build_object('promo_type', v_promo.type, 'access_type', v_promo.access_type, 'requires_payment', v_promo.requires_payment)
  );

  UPDATE public.kinora_promo_codes
  SET redemption_count = redemption_count + 1,
      total_redemptions = COALESCE(total_redemptions, redemption_count) + 1
  WHERE id = v_promo.id;

  RETURN jsonb_build_object(
    'success', true,
    'promo_type', v_promo.type,
    'access_type', v_promo.access_type,
    'plan', COALESCE(v_promo.access_plan, v_promo.trial_plan),
    'started_at', v_started_at,
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_redeemed', 'message', 'Promo ini sudah pernah digunakan.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE ALL ON FUNCTION public.redeem_kinora_promo(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_kinora_promo(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
