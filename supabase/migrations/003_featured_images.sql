-- ============================================================
-- FEATURED IMAGES TABLE FOR HOMEPAGE HERO ROTATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nomdfldpzblimzdrccxl/sql/new
-- ============================================================

CREATE TABLE IF NOT EXISTS featured_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url     TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'behance')),
  source_link   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS featured_images_active_idx ON featured_images(is_active);
CREATE INDEX IF NOT EXISTS featured_images_order_idx ON featured_images(display_order);

-- Enable RLS
ALTER TABLE featured_images ENABLE ROW LEVEL SECURITY;

-- Policies:
-- 1. Public can read active images
CREATE POLICY "Public read active featured images"
  ON featured_images FOR SELECT
  USING (is_active = true);

-- 2. Authenticated (Admin) can read all
CREATE POLICY "Admin read all featured images"
  ON featured_images FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. Authenticated (Admin) can write/update/delete
CREATE POLICY "Admin write featured images"
  ON featured_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed the initial 8 looks from the atelier lookbook
INSERT INTO featured_images (image_url, source, is_active, display_order)
VALUES
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505825/iroshi-gallery-img_13.jpg.png', 'manual', true, 1),
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505818/iroshi-gallery-img_12.jpg.jpg', 'manual', true, 2),
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505817/iroshi-gallery-img_11.jpg.jpg', 'manual', true, 3),
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505816/iroshi-gallery-img_10.jpg.jpg', 'manual', true, 4),
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505814/iroshi-gallery-img_9.jpg.jpg', 'manual', true, 5),
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505813/iroshi-gallery-img_8.jpg.jpg', 'manual', true, 6),
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505812/iroshi-gallery-img_7.jpg.jpg', 'manual', true, 7),
  ('https://res.cloudinary.com/ecyvwovp/image/upload/v1788505811/iroshi-gallery-img_5.jpg.jpg', 'manual', true, 8)
ON CONFLICT DO NOTHING;
