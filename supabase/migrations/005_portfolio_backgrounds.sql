-- ============================================================
-- 005: PORTFOLIO BACKGROUND IMAGES TABLE
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nomdfldpzblimzdrccxl/sql/new
-- ============================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS portfolio_backgrounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classic_url     TEXT NOT NULL DEFAULT '/portfolio/background.jpg',
  custom_url      TEXT NOT NULL DEFAULT '/portfolio/custom-background.png',
  classic_pos_x   NUMERIC NOT NULL DEFAULT 50,
  classic_pos_y   NUMERIC NOT NULL DEFAULT 0,
  custom_pos_x    NUMERIC NOT NULL DEFAULT 50,
  custom_pos_y    NUMERIC NOT NULL DEFAULT 0,
  active_theme    TEXT NOT NULL DEFAULT 'classic' CHECK (active_theme IN ('classic', 'custom')),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE portfolio_backgrounds ENABLE ROW LEVEL SECURITY;

-- 1. Public can read portfolio backgrounds
DROP POLICY IF EXISTS "Public read portfolio backgrounds" ON portfolio_backgrounds;
CREATE POLICY "Public read portfolio backgrounds"
  ON portfolio_backgrounds FOR SELECT
  USING (true);

-- 2. Authenticated (Admin) can insert/update/delete
DROP POLICY IF EXISTS "Admin write portfolio backgrounds" ON portfolio_backgrounds;
CREATE POLICY "Admin write portfolio backgrounds"
  ON portfolio_backgrounds FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed initial row
INSERT INTO portfolio_backgrounds (
  classic_url,
  custom_url,
  classic_pos_x,
  classic_pos_y,
  custom_pos_x,
  custom_pos_y,
  active_theme
)
VALUES (
  '/portfolio/background.jpg',
  '/portfolio/custom-background.png',
  50,
  0,
  50,
  0,
  'classic'
)
ON CONFLICT DO NOTHING;
