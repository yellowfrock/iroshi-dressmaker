-- ============================================================
-- Iroshi Dress Maker — Initial Database Schema
-- Migration: 001_initial_schema
-- ============================================================
-- Run this SQL in your Supabase project SQL editor.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CATEGORIES TABLE
-- Stores dress categories (Bridal, Rental, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO categories (name, slug) VALUES
  ('Bridal', 'bridal'),
  ('Rental', 'rental')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DRESSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dresses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dress_code   TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description  TEXT,
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'unavailable')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,  -- soft delete flag
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dresses_updated_at
  BEFORE UPDATE ON dresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DRESS IMAGES TABLE
-- Each dress may have multiple photos
-- ============================================================
CREATE TABLE IF NOT EXISTS dress_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dress_id      UUID NOT NULL REFERENCES dresses(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  image_order   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dress_images_dress_id_idx ON dress_images(dress_id);
CREATE INDEX IF NOT EXISTS dress_images_order_idx ON dress_images(dress_id, image_order);

-- ============================================================
-- SITE SETTINGS TABLE
-- One row, holds business config (WhatsApp number, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_number  TEXT,         -- e.g. '94771234567' (no + prefix, no spaces)
  business_name    TEXT DEFAULT 'Iroshi Dress Maker',
  contact_email    TEXT,
  phone_number     TEXT,
  address          TEXT,
  instagram_url    TEXT,
  facebook_url     TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings row
INSERT INTO site_settings (business_name)
VALUES ('Iroshi Dress Maker')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE dresses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dress_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;

-- ---- CATEGORIES ----
-- Public can read categories
CREATE POLICY "Public read categories"
  ON categories FOR SELECT USING (true);

-- Only authenticated (admin) users can write
CREATE POLICY "Authenticated write categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---- DRESSES ----
-- Public can read active dresses only
CREATE POLICY "Public read active dresses"
  ON dresses FOR SELECT USING (is_active = true);

-- Authenticated (admin) can read all dresses (including inactive)
CREATE POLICY "Admin read all dresses"
  ON dresses FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated can write
CREATE POLICY "Authenticated write dresses"
  ON dresses FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---- DRESS IMAGES ----
-- Public can read images of active dresses
CREATE POLICY "Public read dress images"
  ON dress_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dresses
      WHERE dresses.id = dress_images.dress_id
        AND dresses.is_active = true
    )
  );

-- Authenticated can read all images
CREATE POLICY "Admin read all dress images"
  ON dress_images FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated can write
CREATE POLICY "Authenticated write dress images"
  ON dress_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---- SITE SETTINGS ----
-- Public can read settings (needed for WhatsApp number, etc.)
CREATE POLICY "Public read site settings"
  ON site_settings FOR SELECT USING (true);

-- Only authenticated can modify
CREATE POLICY "Authenticated write site settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
