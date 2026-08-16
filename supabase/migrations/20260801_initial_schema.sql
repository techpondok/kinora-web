-- ============================================================
-- KINORA INITIAL SCHEMA
-- ============================================================
-- Base tables for Kinora platform.
-- References auth.users (Supabase Auth native).
-- This migration must run BEFORE any other migrations.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
-- FOUNDERS / ADMIN ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS founders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS kinora_admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- FAMILIES
-- ============================================================

CREATE TABLE IF NOT EXISTS kinora_families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  billing_cycle TEXT DEFAULT 'monthly',
  owner_id UUID REFERENCES auth.users(id),
  invite_code TEXT UNIQUE,
  storage_limit_bytes BIGINT DEFAULT 104857600,
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
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',
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
  content_type TEXT DEFAULT 'article',
  category TEXT,
  body TEXT,
  excerpt TEXT,
  cover_url TEXT,
  cover_alt TEXT,

  -- Author
  author_name TEXT,
  created_by UUID REFERENCES auth.users(id),

  -- Status
  status TEXT DEFAULT 'draft',
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

  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'Asia/Jakarta',

  is_free BOOLEAN DEFAULT true,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  payment_method TEXT DEFAULT 'sumopod',

  auto_approve BOOLEAN DEFAULT true,
  max_participants INTEGER,

  status TEXT DEFAULT 'draft',

  meeting_url TEXT,
  recording_url TEXT,

  registration_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_webinar_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES kinora_webinars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'none',
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
  user_id UUID REFERENCES auth.users(id),
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
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- ============================================================
-- CONSULTANTS
-- ============================================================

CREATE TABLE IF NOT EXISTS kinora_consultants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  consultant_user_id UUID REFERENCES auth.users(id),
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
  user_id UUID NOT NULL REFERENCES auth.users(id),
  article_id UUID REFERENCES kinora_articles(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES kinora_webinars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONTENT PREFERENCES / NEWSLETTER
-- ============================================================

CREATE TABLE IF NOT EXISTS kinora_content_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  preference_mode TEXT DEFAULT 'all',
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
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
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
  seller_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kinora_marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES kinora_marketplace_items(id),
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'sumopod',
  payment_reference TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_families_owner ON kinora_families(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON kinora_family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON kinora_family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_article ON kinora_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON kinora_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON kinora_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON kinora_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_webinar ON kinora_webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_user ON kinora_webinar_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_config_key ON kinora_landing_config(key);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Admin check function (used by RLS policies)
CREATE OR REPLACE FUNCTION is_kinora_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM founders WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM kinora_admin_roles WHERE user_id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment article read count
CREATE OR REPLACE FUNCTION increment_article_read_count(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE kinora_articles SET read_count = COALESCE(read_count, 0) + 1 WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DONE
-- ============================================================
