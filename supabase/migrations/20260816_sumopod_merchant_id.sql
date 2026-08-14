-- ============================================================
-- Add Merchant ID columns to kinora_payment_settings
-- Required for SumoPod API authentication
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_payment_settings' AND column_name = 'sumopod_sandbox_merchant_id') THEN
    ALTER TABLE kinora_payment_settings ADD COLUMN sumopod_sandbox_merchant_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_payment_settings' AND column_name = 'sumopod_production_merchant_id') THEN
    ALTER TABLE kinora_payment_settings ADD COLUMN sumopod_production_merchant_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_payment_settings' AND column_name = 'sumopod_enabled') THEN
    ALTER TABLE kinora_payment_settings ADD COLUMN sumopod_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;
