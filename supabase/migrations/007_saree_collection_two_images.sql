-- =============================================================================
-- Migration: 007_saree_collection_two_images.sql
-- Description: Adds saree_code and images array columns to saree_collection_items
-- =============================================================================

-- 1. Add saree_code column if not exists
ALTER TABLE public.saree_collection_items 
ADD COLUMN IF NOT EXISTS saree_code TEXT;

-- 2. Add images text array column if not exists
ALTER TABLE public.saree_collection_items 
ADD COLUMN IF NOT EXISTS images TEXT[];

-- 3. Backfill clean unique default codes to any existing items where saree_code is NULL
UPDATE public.saree_collection_items
SET saree_code = 'SR-' || LPAD(COALESCE(sort_order, 1)::text, 3, '0')
WHERE saree_code IS NULL;

-- 4. Backfill images array from image_url and detail_url if present
UPDATE public.saree_collection_items
SET images = ARRAY[image_url, detail_url]::TEXT[]
WHERE images IS NULL AND image_url IS NOT NULL AND detail_url IS NOT NULL;

UPDATE public.saree_collection_items
SET images = ARRAY[image_url]::TEXT[]
WHERE images IS NULL AND image_url IS NOT NULL AND detail_url IS NULL;

-- 5. Create unique index for saree_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_saree_collection_items_code 
ON public.saree_collection_items (saree_code) 
WHERE saree_code IS NOT NULL;

