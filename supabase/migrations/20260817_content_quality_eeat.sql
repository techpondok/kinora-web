-- ============================================================
-- Content Quality & E-E-A-T Enhancement
-- Adds: Authors, Reviewers, References, FAQ, Quality Fields
-- ============================================================

-- ============================================================
-- AUTHORS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  expertise TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authors_slug ON kinora_authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_user ON kinora_authors(user_id);

-- ============================================================
-- REVIEWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS kinora_reviewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  expertise TEXT,
  bio TEXT,
  avatar_url TEXT,
  credentials TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviewers_slug ON kinora_reviewers(slug);

-- ============================================================
-- ARTICLE QUALITY COLUMNS
-- ============================================================
DO $$
BEGIN
  -- Author FK
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'author_id') THEN
    ALTER TABLE kinora_articles ADD COLUMN author_id UUID REFERENCES kinora_authors(id);
  END IF;

  -- Reviewer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'reviewer_id') THEN
    ALTER TABLE kinora_articles ADD COLUMN reviewer_id UUID REFERENCES kinora_reviewers(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'reviewed_at') THEN
    ALTER TABLE kinora_articles ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;

  -- References (JSONB array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'references') THEN
    ALTER TABLE kinora_articles ADD COLUMN "references" JSONB DEFAULT '[]';
  END IF;

  -- FAQ (JSONB array of {question, answer})
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'faq') THEN
    ALTER TABLE kinora_articles ADD COLUMN faq JSONB DEFAULT '[]';
  END IF;

  -- Quick answer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'quick_answer') THEN
    ALTER TABLE kinora_articles ADD COLUMN quick_answer TEXT;
  END IF;

  -- Disclaimer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'disclaimer') THEN
    ALTER TABLE kinora_articles ADD COLUMN disclaimer TEXT;
  END IF;

  -- Editorial status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'editorial_status') THEN
    ALTER TABLE kinora_articles ADD COLUMN editorial_status TEXT DEFAULT 'draft';
  END IF;

  -- Word count (cached)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'word_count') THEN
    ALTER TABLE kinora_articles ADD COLUMN word_count INTEGER DEFAULT 0;
  END IF;

  -- Content quality score (internal)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'quality_score') THEN
    ALTER TABLE kinora_articles ADD COLUMN quality_score INTEGER DEFAULT 0;
  END IF;

  -- Tags as proper array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'tags') THEN
    ALTER TABLE kinora_articles ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- Secondary keywords
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'secondary_keywords') THEN
    ALTER TABLE kinora_articles ADD COLUMN secondary_keywords TEXT[] DEFAULT '{}';
  END IF;

  -- Summary/excerpt
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'summary') THEN
    ALTER TABLE kinora_articles ADD COLUMN summary TEXT;
  END IF;

  -- Sensitive content flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'sensitive') THEN
    ALTER TABLE kinora_articles ADD COLUMN sensitive BOOLEAN DEFAULT false;
  END IF;

  -- Allow comments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'allow_comments') THEN
    ALTER TABLE kinora_articles ADD COLUMN allow_comments BOOLEAN DEFAULT true;
  END IF;

  -- Source
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'source_name') THEN
    ALTER TABLE kinora_articles ADD COLUMN source_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'source_url') THEN
    ALTER TABLE kinora_articles ADD COLUMN source_url TEXT;
  END IF;

  -- Robots
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'robots_index') THEN
    ALTER TABLE kinora_articles ADD COLUMN robots_index BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kinora_articles' AND column_name = 'robots_follow') THEN
    ALTER TABLE kinora_articles ADD COLUMN robots_follow BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE kinora_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinora_reviewers ENABLE ROW LEVEL SECURITY;

-- Public can read active authors/reviewers
DROP POLICY IF EXISTS "Public can read authors" ON kinora_authors;
CREATE POLICY "Public can read authors" ON kinora_authors FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can read reviewers" ON kinora_reviewers;
CREATE POLICY "Public can read reviewers" ON kinora_reviewers FOR SELECT USING (is_active = true);

-- Admin full access
DROP POLICY IF EXISTS "Admins manage authors" ON kinora_authors;
CREATE POLICY "Admins manage authors" ON kinora_authors FOR ALL TO authenticated USING (is_kinora_admin()) WITH CHECK (is_kinora_admin());

DROP POLICY IF EXISTS "Admins manage reviewers" ON kinora_reviewers;
CREATE POLICY "Admins manage reviewers" ON kinora_reviewers FOR ALL TO authenticated USING (is_kinora_admin()) WITH CHECK (is_kinora_admin());
