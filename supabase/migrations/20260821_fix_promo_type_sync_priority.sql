-- Fix promo trigger priority: INSERT defaults can set type='trial' before
-- the trigger runs, so prefer explicit promo_type from existing admin forms.

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

NOTIFY pgrst, 'reload schema';
