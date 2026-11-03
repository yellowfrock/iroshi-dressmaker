-- =============================================================================
-- Migration: 004_latest_collection_images.sql
-- Description: Creates the latest_collection_images table for the Portfolio 
--              "Latest Collection" editorial gallery.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.latest_collection_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'manual', 'behance')),
    source_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.latest_collection_images ENABLE ROW LEVEL SECURITY;

-- 1. Public can read active images (needed for portfolio view)
DROP POLICY IF EXISTS "Allow public read for active latest collection images" ON public.latest_collection_images;
CREATE POLICY "Allow public read for active latest collection images"
    ON public.latest_collection_images FOR SELECT
    USING (is_active = true);

-- 2. Authenticated users (admin) have full CRUD permissions
DROP POLICY IF EXISTS "Allow admin full access to latest collection images" ON public.latest_collection_images;
CREATE POLICY "Allow admin full access to latest collection images"
    ON public.latest_collection_images FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Index for performant querying of active images sorted by display_order & creation date
CREATE INDEX IF NOT EXISTS idx_latest_collection_images_active_order 
    ON public.latest_collection_images (is_active, display_order, created_at DESC);
