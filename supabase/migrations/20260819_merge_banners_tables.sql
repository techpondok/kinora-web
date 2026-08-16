-- ============================================================
-- Merge dashboard_banners into kinora_banners
-- Only copy columns that exist in dashboard_banners
-- ============================================================

-- Copy minimal shared columns (title, description, image_url, is_active, dates)
INSERT INTO kinora_banners (title, description, image_url, placement, is_active, created_at, updated_at)
SELECT
  COALESCE(title, 'Untitled'),
  description,
  image_url,
  'dashboard',
  COALESCE(is_active, true),
  COALESCE(created_at, now()),
  COALESCE(updated_at, now())
FROM dashboard_banners
ON CONFLICT DO NOTHING;

-- Drop the old table
DROP TABLE IF EXISTS dashboard_banners;
