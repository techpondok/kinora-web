-- ============================================================
-- KINORA LOCAL DEVELOPMENT - Full Schema Migration
-- ============================================================
-- Run: psql -U postgres -d kinora_development -f server/migrations/001_init_local.sql
--
-- This creates the full Kinora schema for local PostgreSQL development.
-- Adapted from Production Supabase schema (sasigbuc...).
-- Removes Supabase-specific references (auth.users, auth.uid(), RLS policies).
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- AUTH (local replacement for Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'user', 'admin', 'founder'
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Landing/app configuration (key-value store)
CREATE TABLE IF NOT EXISTS kinora_landing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment settings (singleton row, id=1)
CREATE TABLE IF NOT EXISTS kinora_payment_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  primary_payment_gateway TEXT DEFAULT 'sumopod',
  
  -- Sumopod Sandbox
  sumopod_sandbox BOOLEAN DEFAULT true,
  sumopod_sandbox_api_key TEXT,
  sumopod_sandbox_api_url TEXT,
  sumopod_sandbox_webhook_secret TEXT,
  sumopod_sandbox_webhook_token TEXT,
  
  -- Sumopod Production
  sumopod_production_api_key TEXT,
  sumopod_production_api_url TEXT,
  sumopod_production_webhook_secret TEXT,
  sumopod_production_webhook_token TEXT,
  
  -- Sumopod settings
  sumopod_default_payment_method TEXT DEFAULT 'qris',
  sumopod_fee_percentage NUMERIC DEFAULT 0.7,
  sumopod_fee_fixed INTEGER DEFAULT 300,
  
  -- Tripay
  tripay_sandbox BOOLEAN DEFAULT true,
  tripay_merchant_code TEXT,
  tripay_api_key TEXT,
  tripay_private_key TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default payment settings row
INSERT INTO kinora_payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FAMILIES
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free', -- free, plus
  billing_cycle TEXT DEFAULT 'monthly',
  owner_id UUID REFERENCES auth_users(id),
  invite_code TEXT UNIQUE,
  storage_limit_bytes BIGINT DEFAULT 104857600, -- 100MB
  storage_used_bytes BIGINT DEFAULT 0,
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES kinora_families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  role TEXT DEFAULT 'member', -- owner, parent, adult, teen, child, member
  nickname TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content_type TEXT DEFAULT 'article', -- article, news, tips, story
  category TEXT,
  body TEXT,
  excerpt TEXT,
  cover_url TEXT,
  cover_alt TEXT,
  
  -- Author
  author_name TEXT,
  created_by UUID REFERENCES auth_users(id),
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, archived
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- SEO
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  seo_score INTEGER DEFAULT 0,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  
  -- Stats
  read_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kinora_articles_slug ON kinora_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kinora_articles_status ON kinora_articles(status);
CREATE INDEX IF NOT EXISTS idx_kinora_articles_published ON kinora_articles(published_at DESC);

-- ============================================================
-- WEBINARS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_webinars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cover_url TEXT,
  
  -- Schedule
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'Asia/Jakarta',
  
  -- Access
  is_free BOOLEAN DEFAULT true,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  payment_method TEXT DEFAULT 'sumopod',
  
  -- Approval
  auto_approve BOOLEAN DEFAULT true,
  max_participants INTEGER,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, upcoming, live, completed, cancelled
  
  -- Links
  meeting_url TEXT,
  recording_url TEXT,
  
  -- Stats
  registration_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES auth_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_webinar_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES kinora_webinars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled, attended
  payment_status TEXT DEFAULT 'none', -- none, pending, paid, failed, refunded
  payment_reference TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES kinora_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth_users(id),
  parent_id UUID REFERENCES kinora_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  like_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES kinora_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- ============================================================
-- CONSULTANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_consultants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth_users(id),
  name TEXT NOT NULL,
  specialization TEXT,
  bio TEXT,
  avatar_url TEXT,
  price_per_session NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  article_id UUID REFERENCES kinora_articles(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES kinora_webinars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONTENT PREFERENCES / NEWSLETTER
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_content_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth_users(id),
  preference_mode TEXT DEFAULT 'all', -- all, selected
  selected_topics TEXT[] DEFAULT '{}',
  newsletter_enabled BOOLEAN DEFAULT false,
  newsletter_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  channels TEXT[] DEFAULT '{push,in_app}',
  target_audience JSONB DEFAULT '{"type":"all_users"}',
  scheduled_at TIMESTAMPTZ,
  cta_label TEXT,
  cta_url TEXT,
  banner_url TEXT,
  status TEXT DEFAULT 'draft',
  target_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  channel_results JSONB DEFAULT '{}',
  last_error TEXT,
  processing_started_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_broadcast_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES kinora_broadcasts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth_users(id),
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MARKETPLACE
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_marketplace_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  category TEXT,
  image_url TEXT,
  seller_id UUID REFERENCES auth_users(id),
  status TEXT DEFAULT 'active', -- active, sold, archived
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES kinora_marketplace_items(id),
  buyer_id UUID REFERENCES auth_users(id),
  seller_id UUID REFERENCES auth_users(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
  payment_method TEXT DEFAULT 'sumopod',
  payment_reference TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PROMO CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'trial' CHECK (type IN ('trial', 'access_pass', 'discount', 'family_invite')),
  internal_name TEXT,
  promo_type TEXT NOT NULL CHECK (promo_type IN ('trial', 'access_pass', 'discount', 'family_invite')),
  customer_description TEXT,
  internal_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'expired', 'limit_reached', 'disabled', 'archived')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  redemption_limit_type TEXT DEFAULT 'unlimited',
  max_redemptions INTEGER,
  redemption_rule TEXT DEFAULT 'once_per_family',
  max_per_user INTEGER,
  user_eligibility TEXT DEFAULT 'all',
  eligible_plans TEXT[] DEFAULT '{}',
  eligible_billing TEXT[] DEFAULT '{}',
  email_domain_restriction TEXT,
  allow_stacking BOOLEAN DEFAULT false,
  trial_days INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  bonus_storage_bytes BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  one_time_per_user BOOLEAN NOT NULL DEFAULT true,
  trial_plan TEXT,
  trial_bonus_storage_bytes BIGINT DEFAULT 0,
  access_plan TEXT,
  access_duration_type TEXT,
  access_duration_value INTEGER,
  access_bonus_storage_bytes BIGINT DEFAULT 0,
  discount_type TEXT,
  discount_percentage NUMERIC,
  discount_fixed_amount NUMERIC,
  discount_max_amount NUMERIC,
  discount_min_purchase NUMERIC,
  discount_duration TEXT,
  discount_cycles INTEGER,
  invitee_benefit_type TEXT,
  invitee_benefit_value NUMERIC,
  inviter_benefit_type TEXT,
  inviter_benefit_value NUMERIC,
  invite_require_new_user BOOLEAN DEFAULT false,
  invite_require_paid BOOLEAN DEFAULT false,
  invite_max_successful INTEGER,
  total_redemptions INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES kinora_promo_codes(id) ON DELETE CASCADE,
  promo_id UUID NOT NULL REFERENCES kinora_promo_codes(id),
  promo_code TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth_users(id),
  family_id UUID REFERENCES kinora_families(id),
  benefit_type TEXT NOT NULL,
  benefit_value TEXT,
  status TEXT DEFAULT 'redeemed',
  subscription_id UUID,
  payment_id UUID,
  metadata JSONB DEFAULT '{}',
  reserved_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  trial_days INTEGER NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  bonus_storage_bytes BIGINT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DYNAMIC BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  label TEXT,
  button_text TEXT,
  button_link TEXT,
  placement TEXT NOT NULL DEFAULT 'home_top',
  display_variant TEXT DEFAULT 'card',
  display_order INTEGER DEFAULT 0,
  target_type TEXT DEFAULT 'internal',
  audience TEXT DEFAULT 'all',
  platform TEXT[] DEFAULT '{mobile,web}',
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  dismissible BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  dismiss_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_families_owner ON kinora_families(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON kinora_family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON kinora_family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_article ON kinora_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON kinora_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON kinora_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON kinora_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_webinar ON kinora_webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_user ON kinora_webinar_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code ON kinora_promo_codes(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kinora_promo_codes_code_lower_unique ON kinora_promo_codes(lower(code));
CREATE INDEX IF NOT EXISTS idx_promo_status ON kinora_promo_codes(status);
CREATE INDEX IF NOT EXISTS idx_redemption_promo ON kinora_promo_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_redemption_user ON kinora_promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_placement ON kinora_banners(placement);
CREATE INDEX IF NOT EXISTS idx_banners_active ON kinora_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_landing_config_key ON kinora_landing_config(key);

-- ============================================================
-- HELPER FUNCTIONS (replaces Supabase-specific functions)
-- ============================================================

-- Increment article read count
CREATE OR REPLACE FUNCTION increment_article_read_count(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE kinora_articles SET read_count = COALESCE(read_count, 0) + 1 WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA (Development only)
-- ============================================================

-- Default founder account (password: founder123)
INSERT INTO auth_users (email, password_hash, role) VALUES
  ('founder@kinora.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'founder')
ON CONFLICT (email) DO NOTHING;

-- Default admin account (password: admin123)
INSERT INTO auth_users (email, password_hash, role) VALUES
  ('admin@kinora.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Default test user (password: user123)
INSERT INTO auth_users (email, password_hash, role) VALUES
  ('user@kinora.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
