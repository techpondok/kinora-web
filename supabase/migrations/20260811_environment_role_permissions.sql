-- Environment & Infrastructure role permissions
-- Both Founder and Admin can view and edit safe configuration

-- Ensure kinora_payment_settings has proper RLS for admin/founder
ALTER TABLE kinora_payment_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can read payment settings" ON kinora_payment_settings;
DROP POLICY IF EXISTS "Admins can update payment settings" ON kinora_payment_settings;

-- Read: Founder + Admin
CREATE POLICY "Admins can read payment settings"
  ON kinora_payment_settings FOR SELECT
  USING (is_kinora_admin());

-- Update: Founder + Admin
CREATE POLICY "Admins can update payment settings"
  ON kinora_payment_settings FOR UPDATE
  USING (is_kinora_admin())
  WITH CHECK (is_kinora_admin());

-- Audit log table for environment/configuration changes
CREATE TABLE IF NOT EXISTS kinora_config_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role TEXT NOT NULL, -- 'founder' or 'admin'
  setting_key TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  environment TEXT NOT NULL DEFAULT 'development',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS on audit log
ALTER TABLE kinora_config_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read config audit log"
  ON kinora_config_audit_log FOR SELECT
  USING (is_kinora_admin());

CREATE POLICY "Admins can insert config audit log"
  ON kinora_config_audit_log FOR INSERT
  WITH CHECK (is_kinora_admin());

-- Index for audit lookups
CREATE INDEX IF NOT EXISTS idx_config_audit_actor ON kinora_config_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_key ON kinora_config_audit_log(setting_key);
CREATE INDEX IF NOT EXISTS idx_config_audit_created ON kinora_config_audit_log(created_at DESC);
