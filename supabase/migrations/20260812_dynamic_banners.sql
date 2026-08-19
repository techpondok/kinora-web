-- Kinora Dynamic Banner System
-- Consumed by: Mobile App, Web (where applicable)
-- Managed by: Admin via Web Admin

CREATE TABLE IF NOT EXISTS kinora_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  label TEXT, -- small tag like "NEW", "PROMO", "UPDATE"
  button_text TEXT,
  button_link TEXT,

  -- Placement & display
  placement TEXT NOT NULL DEFAULT 'home_top', -- home_top, home_middle, article, webinar, marketplace, consultation, finance, family, chat, profile
  display_variant TEXT DEFAULT 'card', -- hero, compact, card, inline
  display_order INTEGER DEFAULT 0,

  -- Targeting
  target_type TEXT DEFAULT 'internal', -- internal, web, external
  audience TEXT DEFAULT 'all', -- all, free, family_plus, parent, adult, new_user
  platform TEXT[] DEFAULT '{mobile,web}', -- mobile, web, both

  -- Schedule
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,

  -- Behavior
  dismissible BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  dismiss_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_banners_placement ON kinora_banners(placement);
CREATE INDEX IF NOT EXISTS idx_banners_active ON kinora_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_schedule ON kinora_banners(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_banners_audience ON kinora_banners(audience);

-- RLS
ALTER TABLE kinora_banners ENABLE ROW LEVEL SECURITY;

-- Admins full access
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins manage banners" ON kinora_banners;
  CREATE POLICY "Admins manage banners" ON kinora_banners
    FOR ALL
    USING (is_kinora_admin())
    WITH CHECK (is_kinora_admin());
END $$;

-- Authenticated users can read active banners (for Mobile/Web API)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users read active banners" ON kinora_banners;
  CREATE POLICY "Users read active banners" ON kinora_banners
    FOR SELECT
    USING (
      is_active = true
      AND (start_at IS NULL OR start_at <= now())
      AND (end_at IS NULL OR end_at >= now())
    );
END $$;
