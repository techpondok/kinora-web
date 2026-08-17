-- Kinora Promo Code standard contract and redeem RPC.
-- Keeps the richer 20260813 engine columns while exposing the canonical
-- public.kinora_promo_codes / public.kinora_promo_redemptions contract.

CREATE TABLE IF NOT EXISTS public.kinora_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'trial'
    CHECK (type IN ('trial', 'access_pass', 'discount', 'family_invite')),
  trial_days INTEGER NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100),
  bonus_storage_bytes BIGINT NOT NULL DEFAULT 0 CHECK (bonus_storage_bytes >= 0),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  one_time_per_user BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kinora_promo_codes
  ADD COLUMN IF NOT EXISTS promo_type TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS total_redemptions INTEGER,
  ADD COLUMN IF NOT EXISTS redemption_limit_type TEXT,
  ADD COLUMN IF NOT EXISTS redemption_rule TEXT,
  ADD COLUMN IF NOT EXISTS trial_bonus_storage_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS access_bonus_storage_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS redemption_count INTEGER,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS bonus_storage_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS one_time_per_user BOOLEAN;

UPDATE public.kinora_promo_codes
SET
  code = upper(trim(code)),
  type = COALESCE(type, promo_type, 'trial'),
  promo_type = COALESCE(promo_type, type, 'trial'),
  trial_days = COALESCE(trial_days, 0),
  redemption_count = COALESCE(redemption_count, total_redemptions, 0),
  total_redemptions = COALESCE(total_redemptions, redemption_count, 0),
  discount_percent = COALESCE(discount_percent, discount_percentage, 0),
  discount_percentage = COALESCE(discount_percentage, discount_percent, 0),
  bonus_storage_bytes = COALESCE(bonus_storage_bytes, trial_bonus_storage_bytes, access_bonus_storage_bytes, 0),
  trial_bonus_storage_bytes = COALESCE(trial_bonus_storage_bytes, bonus_storage_bytes, 0),
  access_bonus_storage_bytes = COALESCE(access_bonus_storage_bytes, bonus_storage_bytes, 0),
  notes = COALESCE(notes, internal_notes),
  internal_notes = COALESCE(internal_notes, notes),
  one_time_per_user = COALESCE(one_time_per_user, redemption_rule IS DISTINCT FROM 'unlimited_per_user', true),
  is_active = COALESCE(is_active, true),
  updated_at = COALESCE(updated_at, now());

ALTER TABLE public.kinora_promo_codes
  ALTER COLUMN promo_type SET DEFAULT 'trial',
  ALTER COLUMN total_redemptions SET DEFAULT 0,
  ALTER COLUMN redemption_limit_type SET DEFAULT 'unlimited',
  ALTER COLUMN redemption_rule SET DEFAULT 'once_per_user',
  ALTER COLUMN trial_bonus_storage_bytes SET DEFAULT 0,
  ALTER COLUMN access_bonus_storage_bytes SET DEFAULT 0,
  ALTER COLUMN discount_percentage SET DEFAULT 0,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN type SET DEFAULT 'trial',
  ALTER COLUMN trial_days SET NOT NULL,
  ALTER COLUMN trial_days SET DEFAULT 0,
  ALTER COLUMN redemption_count SET NOT NULL,
  ALTER COLUMN redemption_count SET DEFAULT 0,
  ALTER COLUMN discount_percent SET NOT NULL,
  ALTER COLUMN discount_percent SET DEFAULT 0,
  ALTER COLUMN bonus_storage_bytes SET NOT NULL,
  ALTER COLUMN bonus_storage_bytes SET DEFAULT 0,
  ALTER COLUMN one_time_per_user SET NOT NULL,
  ALTER COLUMN one_time_per_user SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kinora_promo_codes_type_check'
      AND conrelid = 'public.kinora_promo_codes'::regclass
  ) THEN
    ALTER TABLE public.kinora_promo_codes
      ADD CONSTRAINT kinora_promo_codes_type_check
      CHECK (type IN ('trial', 'access_pass', 'discount', 'family_invite'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kinora_promo_codes_trial_days_check'
      AND conrelid = 'public.kinora_promo_codes'::regclass
  ) THEN
    ALTER TABLE public.kinora_promo_codes
      ADD CONSTRAINT kinora_promo_codes_trial_days_check CHECK (trial_days >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kinora_promo_codes_max_redemptions_check'
      AND conrelid = 'public.kinora_promo_codes'::regclass
  ) THEN
    ALTER TABLE public.kinora_promo_codes
      ADD CONSTRAINT kinora_promo_codes_max_redemptions_check
      CHECK (max_redemptions IS NULL OR max_redemptions > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.kinora_promo_codes
    GROUP BY lower(code)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate promo codes differ only by case. Merge or rename duplicates before creating idx_kinora_promo_codes_code_lower_unique.';
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS idx_kinora_promo_codes_code_lower_unique
    ON public.kinora_promo_codes (lower(code));
END $$;
CREATE INDEX IF NOT EXISTS idx_kinora_promo_codes_code ON public.kinora_promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_kinora_promo_codes_active ON public.kinora_promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_kinora_promo_codes_expires_at ON public.kinora_promo_codes(expires_at);

CREATE TABLE IF NOT EXISTS public.kinora_promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.kinora_promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_days INTEGER NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  bonus_storage_bytes BIGINT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.kinora_promo_redemptions
  ADD COLUMN IF NOT EXISTS promo_id UUID,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS benefit_type TEXT,
  ADD COLUMN IF NOT EXISTS benefit_value TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS promo_code_id UUID,
  ADD COLUMN IF NOT EXISTS trial_days INTEGER,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS bonus_storage_bytes BIGINT;

UPDATE public.kinora_promo_redemptions r
SET
  promo_code_id = COALESCE(r.promo_code_id, r.promo_id),
  promo_code = COALESCE(r.promo_code, p.code),
  benefit_type = COALESCE(r.benefit_type, p.type),
  benefit_value = COALESCE(r.benefit_value, p.trial_days::TEXT, p.discount_percent::TEXT, p.bonus_storage_bytes::TEXT),
  status = COALESCE(r.status, 'redeemed'),
  trial_days = COALESCE(r.trial_days, 0),
  discount_percent = COALESCE(r.discount_percent, 0),
  bonus_storage_bytes = COALESCE(r.bonus_storage_bytes, 0),
  metadata = COALESCE(r.metadata, '{}'::jsonb)
FROM public.kinora_promo_codes p
WHERE p.id = COALESCE(r.promo_code_id, r.promo_id);

ALTER TABLE public.kinora_promo_redemptions
  ALTER COLUMN promo_code_id SET NOT NULL,
  ALTER COLUMN trial_days SET NOT NULL,
  ALTER COLUMN trial_days SET DEFAULT 0,
  ALTER COLUMN discount_percent SET NOT NULL,
  ALTER COLUMN discount_percent SET DEFAULT 0,
  ALTER COLUMN bonus_storage_bytes SET NOT NULL,
  ALTER COLUMN bonus_storage_bytes SET DEFAULT 0,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_kinora_promo_redemptions_promo
  ON public.kinora_promo_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_kinora_promo_redemptions_user
  ON public.kinora_promo_redemptions(user_id);

CREATE OR REPLACE FUNCTION public.kinora_sync_promo_code_contract()
RETURNS trigger AS $$
BEGIN
  NEW.code := upper(trim(NEW.code));
  NEW.type := COALESCE(NULLIF(NEW.promo_type, ''), NULLIF(NEW.type, ''), 'trial');
  NEW.promo_type := COALESCE(NEW.promo_type, NEW.type);
  NEW.redemption_count := COALESCE(NEW.redemption_count, NEW.total_redemptions, 0);
  NEW.total_redemptions := COALESCE(NEW.total_redemptions, NEW.redemption_count, 0);
  NEW.discount_percent := COALESCE(NEW.discount_percent, NEW.discount_percentage, 0);
  NEW.discount_percentage := COALESCE(NEW.discount_percentage, NEW.discount_percent, 0);
  NEW.bonus_storage_bytes := COALESCE(NEW.bonus_storage_bytes, NEW.trial_bonus_storage_bytes, NEW.access_bonus_storage_bytes, 0);
  NEW.trial_bonus_storage_bytes := COALESCE(NEW.trial_bonus_storage_bytes, NEW.bonus_storage_bytes, 0);
  NEW.access_bonus_storage_bytes := COALESCE(NEW.access_bonus_storage_bytes, NEW.bonus_storage_bytes, 0);
  NEW.notes := COALESCE(NEW.notes, NEW.internal_notes);
  NEW.internal_notes := COALESCE(NEW.internal_notes, NEW.notes);
  NEW.one_time_per_user := COALESCE(NEW.one_time_per_user, NEW.redemption_rule IS DISTINCT FROM 'unlimited_per_user', true);
  NEW.redemption_rule := CASE WHEN NEW.one_time_per_user THEN 'once_per_user' ELSE 'unlimited_per_user' END;
  NEW.redemption_limit_type := CASE WHEN NEW.max_redemptions IS NULL THEN 'unlimited' ELSE 'limited' END;
  NEW.updated_at := now();

  IF NEW.type = 'trial' AND NEW.trial_days <= 0 THEN
    RAISE EXCEPTION 'Trial Days must be greater than 0';
  END IF;
  IF NEW.type = 'discount' AND (NEW.discount_percent <= 0 OR NEW.discount_percent > 100) THEN
    RAISE EXCEPTION 'Discount percent must be greater than 0 and at most 100';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kinora_sync_promo_code_contract ON public.kinora_promo_codes;
CREATE TRIGGER trg_kinora_sync_promo_code_contract
BEFORE INSERT OR UPDATE ON public.kinora_promo_codes
FOR EACH ROW EXECUTE FUNCTION public.kinora_sync_promo_code_contract();

CREATE OR REPLACE FUNCTION public.redeem_kinora_promo(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_promo public.kinora_promo_codes%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Promo tidak berlaku untuk akun ini');
  END IF;

  SELECT * INTO v_promo
  FROM public.kinora_promo_codes
  WHERE lower(code) = lower(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Promo tidak ditemukan');
  END IF;
  IF NOT v_promo.is_active THEN
    RETURN jsonb_build_object('success', false, 'message', 'Promo sudah tidak aktif');
  END IF;
  IF v_promo.expires_at IS NOT NULL AND now() > v_promo.expires_at THEN
    RETURN jsonb_build_object('success', false, 'message', 'Promo sudah kedaluwarsa');
  END IF;
  IF v_promo.max_redemptions IS NOT NULL AND v_promo.redemption_count >= v_promo.max_redemptions THEN
    RETURN jsonb_build_object('success', false, 'message', 'Promo code has reached its redemption limit.');
  END IF;
  IF v_promo.one_time_per_user AND EXISTS (
    SELECT 1 FROM public.kinora_promo_redemptions
    WHERE promo_code_id = v_promo.id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Promo has already been used by this account');
  END IF;

  INSERT INTO public.kinora_promo_redemptions (
    promo_code_id, user_id, trial_days, discount_percent, bonus_storage_bytes, metadata
  ) VALUES (
    v_promo.id, v_user_id, v_promo.trial_days, v_promo.discount_percent, v_promo.bonus_storage_bytes,
    jsonb_build_object('type', v_promo.type, 'promo_code', v_promo.code)
  );

  UPDATE public.kinora_promo_codes
  SET redemption_count = redemption_count + 1,
      total_redemptions = COALESCE(total_redemptions, redemption_count) + 1
  WHERE id = v_promo.id;

  RETURN jsonb_build_object(
    'success', true,
    'promo_code', v_promo.code,
    'type', v_promo.type,
    'message', 'Promo berhasil digunakan'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE ALL ON FUNCTION public.redeem_kinora_promo(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_kinora_promo(TEXT) TO authenticated;

ALTER TABLE public.kinora_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinora_promo_redemptions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kinora_promo_codes TO authenticated;
GRANT SELECT, INSERT ON public.kinora_promo_redemptions TO authenticated;

NOTIFY pgrst, 'reload schema';

DROP POLICY IF EXISTS "Admins manage promo codes" ON public.kinora_promo_codes;
CREATE POLICY "Admins manage promo codes" ON public.kinora_promo_codes
FOR ALL TO authenticated
USING (public.is_kinora_admin())
WITH CHECK (public.is_kinora_admin());

DROP POLICY IF EXISTS "Users can read active promo codes" ON public.kinora_promo_codes;
CREATE POLICY "Users can read active promo codes" ON public.kinora_promo_codes
FOR SELECT TO authenticated
USING (is_active = true AND (expires_at IS NULL OR now() <= expires_at));

DROP POLICY IF EXISTS "Admins read all redemptions" ON public.kinora_promo_redemptions;
CREATE POLICY "Admins read all redemptions" ON public.kinora_promo_redemptions
FOR SELECT TO authenticated
USING (public.is_kinora_admin());

DROP POLICY IF EXISTS "Users can read own redemptions" ON public.kinora_promo_redemptions;
CREATE POLICY "Users can read own redemptions" ON public.kinora_promo_redemptions
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Backend inserts redemptions" ON public.kinora_promo_redemptions;
CREATE POLICY "Backend inserts redemptions" ON public.kinora_promo_redemptions
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

NOTIFY pgrst, 'reload schema';
