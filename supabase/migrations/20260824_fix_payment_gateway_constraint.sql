-- ============================================================
-- Fix primary_payment_gateway constraint
-- Allow: sumopod (only supported gateway for one-time payments)
-- Subscription uses Google Play Billing (not stored here)
-- ============================================================

-- Drop existing constraint if it exists
ALTER TABLE kinora_payment_settings
  DROP CONSTRAINT IF EXISTS kinora_payment_settings_primary_payment_gateway_check;

-- Add updated constraint with supported values
ALTER TABLE kinora_payment_settings
  ADD CONSTRAINT kinora_payment_settings_primary_payment_gateway_check
  CHECK (primary_payment_gateway IN ('sumopod', 'tripay', 'manual'));

-- Ensure current value is valid
UPDATE kinora_payment_settings
  SET primary_payment_gateway = 'sumopod'
  WHERE primary_payment_gateway NOT IN ('sumopod', 'tripay', 'manual')
    OR primary_payment_gateway IS NULL;
