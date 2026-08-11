-- Production environment configuration storage
-- Stores SAFE metadata about the production Supabase project
-- Secrets are stored separately and never returned to frontend

CREATE TABLE IF NOT EXISTS kinora_production_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
  environment_name TEXT DEFAULT 'Kinora Production',
  supabase_project_url TEXT,
  supabase_project_ref TEXT,
  supabase_anon_key TEXT, -- public key, safe to store
  api_base_url TEXT,
  -- Status tracking (safe metadata only)
  database_status TEXT DEFAULT 'not_configured', -- not_configured, connected, failed
  storage_status TEXT DEFAULT 'not_configured',
  auth_status TEXT DEFAULT 'not_configured',
  edge_functions_status TEXT DEFAULT 'not_deployed',
  rls_status TEXT DEFAULT 'not_applied',
  payment_status TEXT DEFAULT 'not_configured',
  webhook_status TEXT DEFAULT 'not_configured',
  email_status TEXT DEFAULT 'not_configured',
  google_play_status TEXT DEFAULT 'not_configured',
  -- Activation
  is_active BOOLEAN DEFAULT false,
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  config_version INTEGER DEFAULT 0,
  -- Deployment tracking
  migrations_applied INTEGER DEFAULT 0,
  migrations_total INTEGER DEFAULT 0,
  edge_functions_deployed INTEGER DEFAULT 0,
  edge_functions_total INTEGER DEFAULT 0,
  secrets_configured INTEGER DEFAULT 0,
  secrets_total INTEGER DEFAULT 0,
  last_migration_at TIMESTAMPTZ,
  last_deployment_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  last_test_result TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE kinora_production_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read production config"
  ON kinora_production_config FOR SELECT
  USING (is_kinora_admin());

CREATE POLICY "Only admins can update production config"
  ON kinora_production_config FOR UPDATE
  USING (is_kinora_admin())
  WITH CHECK (is_kinora_admin());

CREATE POLICY "Only admins can insert production config"
  ON kinora_production_config FOR INSERT
  WITH CHECK (is_kinora_admin());

-- Secrets table (write-only from admin, read-only status check)
-- Values are encrypted or stored server-side only
CREATE TABLE IF NOT EXISTS kinora_production_secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_key TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- database, payment, notification, subscription, email, storage
  is_configured BOOLEAN DEFAULT false,
  configured_at TIMESTAMPTZ,
  configured_by UUID REFERENCES auth.users(id),
  -- Never store actual secret value in plain text here for frontend access
  -- The actual value should be stored via Supabase Vault or server env
  -- This table tracks configuration STATUS only
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kinora_production_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read secret status"
  ON kinora_production_secrets FOR SELECT
  USING (is_kinora_admin());

CREATE POLICY "Only admins can update secret status"
  ON kinora_production_secrets FOR UPDATE
  USING (is_kinora_admin())
  WITH CHECK (is_kinora_admin());

CREATE POLICY "Only admins can insert secret status"
  ON kinora_production_secrets FOR INSERT
  WITH CHECK (is_kinora_admin());

-- Seed required secrets
INSERT INTO kinora_production_secrets (secret_key, description, category) VALUES
  ('SUPABASE_URL', 'Production Supabase project URL', 'database'),
  ('SUPABASE_ANON_KEY', 'Production Supabase anon/public key', 'database'),
  ('SUPABASE_SERVICE_ROLE_KEY', 'Production Supabase service role key', 'database'),
  ('SUMOPOD_API_KEY', 'Sumopod production API key', 'payment'),
  ('SUMOPOD_API_URL', 'Sumopod production API URL', 'payment'),
  ('SUMOPOD_WEBHOOK_SECRET', 'Sumopod webhook signing secret', 'payment'),
  ('SUMOPOD_WEBHOOK_TOKEN', 'Sumopod X-Webhook-Token', 'payment'),
  ('TRIPAY_PRIVATE_KEY', 'Tripay callback private key', 'payment'),
  ('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY', 'Google Play purchase verification', 'subscription'),
  ('FCM_SERVER_KEY', 'Firebase Cloud Messaging key', 'notification'),
  ('RESEND_API_KEY', 'Resend email API key', 'email')
ON CONFLICT (secret_key) DO NOTHING;
