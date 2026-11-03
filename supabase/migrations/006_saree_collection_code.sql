-- =============================================================================
-- Migration: 006_saree_collection_code.sql
-- Description: Adds unique saree_code column to saree_collection_items table
--              without deleting or altering existing data.
-- =============================================================================

-- 1. Add saree_code column if not exists
ALTER TABLE public.saree_collection_items 
ADD COLUMN IF NOT EXISTS saree_code TEXT;

-- 2. Assign clean unique default codes to any existing items where saree_code is NULL
UPDATE public.saree_collection_items
SET saree_code = 'SR-' || LPAD(COALESCE(sort_order, 1)::text, 3, '0')
WHERE saree_code IS NULL;

-- 3. Create unique index for saree_code (enforcing uniqueness when populated)
CREATE UNIQUE INDEX IF NOT EXISTS idx_saree_collection_items_code 
ON public.saree_collection_items (saree_code) 
WHERE saree_code IS NOT NULL;
