-- Kinora Promo Code Engine
-- Types: trial, access_pass, discount, family_invite

CREATE TABLE IF NOT EXISTS kinora_promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  internal_name TEXT,
  promo_type TEXT NOT NULL CHECK (promo_type IN ('trial', 'access_pass', 'discount', 'family_invite')),
  customer_description TEXT,
  internal_notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'expired', 'limit_reached', 'disabled', 'archived')),

  -- Validity
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Redemption limits
  redemption_limit_type TEXT DEFAULT 'unlimited' CHECK (redemption_limit_type IN ('unlimited', 'limited')),
  max_redemptions INTEGER,
  redemption_rule TEXT DEFAULT 'once_per_family' CHECK (redemption_rule IN ('unlimited_per_user', 'once_per_user', 'once_per_family', 'custom_per_user')),
  max_per_user INTEGER,

  -- Eligibility
  user_eligibility TEXT DEFAULT 'all' CHECK (user_eligibility IN ('all', 'new_users', 'existing_users', 'free_users', 'plus_users')),
  eligible_plans TEXT[] DEFAULT '{}', -- empty = all plans
  eligible_billing TEXT[] DEFAULT '{}', -- 'monthly', 'annual', empty = all
  email_domain_restriction TEXT, -- e.g. '@partner.com'

  -- Stacking
  allow_stacking BOOLEAN DEFAULT false,

  -- TRIAL config
  trial_days INTEGER,
  trial_plan TEXT,
  trial_bonus_storage_bytes BIGINT DEFAULT 0,

  -- ACCESS PASS config
  access_plan TEXT,
  access_duration_type TEXT CHECK (access_duration_type IN ('days', 'months', 'lifetime')),
  access_duration_value INTEGER,
  access_bonus_storage_bytes BIGINT DEFAULT 0,

  -- DISCOUNT config
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_percentage NUMERIC,
  discount_fixed_amount NUMERIC,
  discount_max_amount NUMERIC,
  discount_min_purchase NUMERIC,
  discount_duration TEXT CHECK (discount_duration IN ('first_payment', 'x_cycles', 'forever')),
  discount_cycles INTEGER,

  -- FAMILY INVITE config
  invitee_benefit_type TEXT CHECK (invitee_benefit_type IN ('plus_days', 'trial_days', 'discount', 'storage', 'access_pass')),
  invitee_benefit_value NUMERIC,
  inviter_benefit_type TEXT CHECK (inviter_benefit_type IN ('none', 'plus_days', 'discount', 'storage', 'access_pass')),
  inviter_benefit_value NUMERIC,
  invite_require_new_user BOOLEAN DEFAULT false,
  invite_require_paid BOOLEAN DEFAULT false,
  invite_max_successful INTEGER,

  -- Metadata
  total_redemptions INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Redemption history
CREATE TABLE IF NOT EXISTS kinora_promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_id UUID NOT NULL REFERENCES kinora_promo_codes(id),
  promo_code TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  family_id UUID,
  benefit_type TEXT NOT NULL,
  benefit_value TEXT,
  status TEXT DEFAULT 'redeemed' CHECK (status IN ('reserved', 'pending', 'redeemed', 'active', 'completed', 'failed', 'cancelled', 'expired')),
  subscription_id UUID,
  payment_id UUID,
  metadata JSONB DEFAULT '{}',
  reserved_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_code ON kinora_promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_type ON kinora_promo_codes(promo_type);
CREATE INDEX IF NOT EXISTS idx_promo_status ON kinora_promo_codes(status);
CREATE INDEX IF NOT EXISTS idx_redemption_promo ON kinora_promo_redemptions(promo_id);
CREATE INDEX IF NOT EXISTS idx_redemption_user ON kinora_promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemption_family ON kinora_promo_redemptions(family_id);
CREATE INDEX IF NOT EXISTS idx_redemption_code ON kinora_promo_redemptions(promo_code);

-- RLS
ALTER TABLE kinora_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinora_promo_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage promo codes" ON kinora_promo_codes;
DROP POLICY IF EXISTS "Admins read all redemptions" ON kinora_promo_redemptions;
DROP POLICY IF EXISTS "Users can read own redemptions" ON kinora_promo_redemptions;
DROP POLICY IF EXISTS "Backend inserts redemptions" ON kinora_promo_redemptions;

CREATE POLICY "Admins manage promo codes" ON kinora_promo_codes FOR ALL USING (is_kinora_admin());
CREATE POLICY "Admins read all redemptions" ON kinora_promo_redemptions FOR SELECT USING (is_kinora_admin());
CREATE POLICY "Users can read own redemptions" ON kinora_promo_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Backend inserts redemptions" ON kinora_promo_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
