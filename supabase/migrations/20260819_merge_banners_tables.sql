-- ============================================================
-- Merge dashboard_banners into kinora_banners
-- Only copy columns that exist in dashboard_banners
-- ============================================================

-- Copy minimal shared columns only when the old table still exists.
DO $$
BEGIN
  IF to_regclass('public.dashboard_banners') IS NOT NULL THEN
    INSERT INTO kinora_banners (title, description, image_url, placement, is_active, created_at, updated_at)
    SELECT
      COALESCE(title, 'Untitled'),
      description,
      image_url,
      'dashboard',
      COALESCE(is_active, true),
      COALESCE(created_at, now()),
      COALESCE(updated_at, now())
    FROM public.dashboard_banners
    ON CONFLICT DO NOTHING;
  ELSE
    RAISE LOG '[BANNERS][MERGE] dashboard_banners not found, skipping legacy copy.';
  END IF;
END $$;

-- Drop the old table
DROP TABLE IF EXISTS dashboard_banners;
