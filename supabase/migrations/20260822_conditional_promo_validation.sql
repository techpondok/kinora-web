-- Make promo validation conditional and defensive across old/new admin payloads.
-- Access Pass, Discount, and Family Invite must never require trial_days.

ALTER TABLE public.kinora_promo_codes
  ADD COLUMN IF NOT EXISTS access_duration_days INTEGER CHECK (access_duration_days IS NULL OR access_duration_days > 0),
  ADD COLUMN IF NOT EXISTS access_lifetime BOOLEAN NOT NULL DEFAULT false;

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
  NEW.access_duration_days := CASE
    WHEN v_type = 'access_pass' AND COALESCE(NEW.access_lifetime, false) = false
      THEN COALESCE(NEW.access_duration_days, NEW.access_duration_value)
    ELSE NULL
  END;
  NEW.access_lifetime := v_type = 'access_pass' AND (
    COALESCE(NEW.access_lifetime, false) = true OR NEW.access_duration_type = 'lifetime'
  );
  NEW.notes := COALESCE(NEW.notes, NEW.internal_notes);
  NEW.internal_notes := COALESCE(NEW.internal_notes, NEW.notes);
  NEW.one_time_per_user := COALESCE(NEW.one_time_per_user, NEW.redemption_rule IS DISTINCT FROM 'unlimited_per_user', true);
  NEW.redemption_rule := CASE WHEN NEW.one_time_per_user THEN 'once_per_user' ELSE 'unlimited_per_user' END;
  NEW.redemption_limit_type := CASE WHEN NEW.max_redemptions IS NULL THEN 'unlimited' ELSE 'limited' END;
  NEW.updated_at := now();

  IF NEW.type = 'trial' AND NEW.trial_days <= 0 THEN
    RAISE EXCEPTION 'Trial Days is required for Trial promo.';
  END IF;
  IF NEW.type = 'access_pass' AND NEW.access_lifetime = false AND COALESCE(NEW.access_duration_days, 0) <= 0 THEN
    RAISE EXCEPTION 'Access Duration is required.';
  END IF;
  IF NEW.type = 'discount' AND (NEW.discount_percent <= 0 OR NEW.discount_percent > 100) THEN
    RAISE EXCEPTION 'Discount percentage must be between 1%% and 100%%.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
