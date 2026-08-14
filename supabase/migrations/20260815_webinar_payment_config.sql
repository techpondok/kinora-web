-- ============================================================
-- Webinar Payment Configuration Columns
-- Adds payment gateway, application fee, and manual payment toggle
-- ============================================================

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'payment_method') THEN
    ALTER TABLE kinora_webinars ADD COLUMN payment_method TEXT DEFAULT 'sumopod';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'application_fee') THEN
    ALTER TABLE kinora_webinars ADD COLUMN application_fee NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'allow_manual_payment') THEN
    ALTER TABLE kinora_webinars ADD COLUMN allow_manual_payment BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'end_at') THEN
    ALTER TABLE kinora_webinars ADD COLUMN end_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'price_amount') THEN
    ALTER TABLE kinora_webinars ADD COLUMN price_amount NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'speaker_name') THEN
    ALTER TABLE kinora_webinars ADD COLUMN speaker_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'is_published') THEN
    ALTER TABLE kinora_webinars ADD COLUMN is_published BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'payment_instructions') THEN
    ALTER TABLE kinora_webinars ADD COLUMN payment_instructions TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'registration_mode') THEN
    ALTER TABLE kinora_webinars ADD COLUMN registration_mode TEXT DEFAULT 'open';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'registration_deadline') THEN
    ALTER TABLE kinora_webinars ADD COLUMN registration_deadline TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'link_visible_before_minutes') THEN
    ALTER TABLE kinora_webinars ADD COLUMN link_visible_before_minutes INTEGER DEFAULT 60;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'allow_waiting_list') THEN
    ALTER TABLE kinora_webinars ADD COLUMN allow_waiting_list BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_webinars' AND column_name = 'slug') THEN
    ALTER TABLE kinora_webinars ADD COLUMN slug TEXT;
  END IF;
END $$;

-- RLS: Admin can manage webinars
ALTER TABLE kinora_webinars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage webinars" ON kinora_webinars;
CREATE POLICY "Admins can manage webinars"
  ON kinora_webinars FOR ALL
  TO authenticated
  USING (is_kinora_admin())
  WITH CHECK (is_kinora_admin());

DROP POLICY IF EXISTS "Users can read published webinars" ON kinora_webinars;
CREATE POLICY "Users can read published webinars"
  ON kinora_webinars FOR SELECT
  TO authenticated
  USING (is_published = true);
