-- =============================================================================
-- Migration: 005_collections.sql
-- Description: Creates latest_collection_items and saree_collection_items tables
--              along with collection-images storage bucket, RLS, and seed data.
-- =============================================================================

-- Ensure UUID extension is active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Helper function for updated_at timestamps (if not already defined)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. TABLE: latest_collection_items
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.latest_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle_badge TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    image_path TEXT,
    detail_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_latest_collection_items_updated_at ON public.latest_collection_items;
CREATE TRIGGER tr_latest_collection_items_updated_at
    BEFORE UPDATE ON public.latest_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_latest_collection_published_order 
    ON public.latest_collection_items (is_published, sort_order ASC, created_at DESC);

-- Enable RLS
ALTER TABLE public.latest_collection_items ENABLE ROW LEVEL SECURITY;

-- Policies for latest_collection_items:
DROP POLICY IF EXISTS "Public can view published latest collection items" ON public.latest_collection_items;
CREATE POLICY "Public can view published latest collection items"
    ON public.latest_collection_items FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Admin full access to latest collection items" ON public.latest_collection_items;
CREATE POLICY "Admin full access to latest collection items"
    ON public.latest_collection_items FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- 3. TABLE: saree_collection_items
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.saree_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle_badge TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    image_path TEXT,
    detail_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_saree_collection_items_updated_at ON public.saree_collection_items;
CREATE TRIGGER tr_saree_collection_items_updated_at
    BEFORE UPDATE ON public.saree_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_saree_collection_published_order 
    ON public.saree_collection_items (is_published, sort_order ASC, created_at DESC);

-- Enable RLS
ALTER TABLE public.saree_collection_items ENABLE ROW LEVEL SECURITY;

-- Policies for saree_collection_items:
DROP POLICY IF EXISTS "Public can view published saree collection items" ON public.saree_collection_items;
CREATE POLICY "Public can view published saree collection items"
    ON public.saree_collection_items FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Admin full access to saree collection items" ON public.saree_collection_items;
CREATE POLICY "Admin full access to saree collection items"
    ON public.saree_collection_items FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- 4. STORAGE: collection-images BUCKET & POLICIES
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'collection-images',
    'collection-images',
    true,
    10485760, -- 10 MB limit
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = NULL;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read collection images" ON storage.objects;
CREATE POLICY "Public read collection images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'collection-images');

DROP POLICY IF EXISTS "Admin insert collection images" ON storage.objects;
CREATE POLICY "Admin insert collection images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'collection-images'
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Admin update collection images" ON storage.objects;
CREATE POLICY "Admin update collection images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'collection-images'
        AND auth.role() = 'authenticated'
    )
    WITH CHECK (
        bucket_id = 'collection-images'
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Admin delete collection images" ON storage.objects;
CREATE POLICY "Admin delete collection images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'collection-images'
        AND auth.role() = 'authenticated'
    );

-- =============================================================================
-- 5. SEED DATA FOR LATEST COLLECTION
-- =============================================================================
INSERT INTO public.latest_collection_items (title, subtitle_badge, description, image_url, sort_order, is_published)
VALUES
    (
        'Ivory Bridal Masterpiece',
        'Hand-Beaded Couture',
        'Hand-draped in imported French lace with pearl beading and cathedral-length train. Structured corset boning with silk organza overlay.',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
        1,
        true
    ),
    (
        'Emerald Reception Gown',
        'Zardosi Embroidery',
        'Sculpted reception silhouette in emerald duchess satin with intricate zardosi embroidery and crystal accents.',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
        2,
        true
    ),
    (
        'Blush Evening Silhouette',
        'Aari Hand Embroidery',
        'Featherlight sheer drape in Italian organza with hand-embroidered scalloped edges and delicate sequin highlights.',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
        3,
        true
    ),
    (
        'Sapphire Royal Gown',
        'Hand-Woven Gold Thread',
        'The crown jewel of the atelier — a sapphire gown distinguished by a kaleidoscopic bead-work bodice with gold thread detailing.',
        'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
        4,
        true
    ),
    (
        'Pearl Organza Couture',
        'Pearl & Cutwork Embroidery',
        'Crisp ethereal organza with artisanal hand-embroidered scalloped edges, micro-cutwork florals, and delicate pearl highlights.',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80',
        5,
        true
    )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 6. SEED DATA FOR SAREE COLLECTION
-- =============================================================================
INSERT INTO public.saree_collection_items (title, subtitle_badge, description, image_url, sort_order, is_published)
VALUES
    (
        'Royal Kanchipuram Gold Saree',
        'Pure Silk Brocade',
        'Heirloom bridal drape woven with pure zari threads, temple borders, and contrast pallu hand-finished in Colombo atelier.',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
        1,
        true
    ),
    (
        'Emerald Velvet Bridal Saree',
        'Zardosi Embroidery',
        'Deep forest emerald drape complemented by heavy zardosi borders, crystal stone work, and a bespoke embellished blouse.',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
        2,
        true
    ),
    (
        'Rose Gold Organza Saree',
        'Aari Needlework',
        'Featherweight organza embellished with subtle rose gold cutdana, pearl tassels, and delicate floral border embroidery.',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
        3,
        true
    ),
    (
        'Midnight Sapphire Silk Saree',
        'Antique Threadwork',
        'Lustrous midnight blue raw silk with antique bullion knotting, regal peacock motifs, and shimmering pallu drape.',
        'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
        4,
        true
    ),
    (
        'Ivory Pearl Bridal Saree',
        'Pearl & Resham',
        'Ethereal ivory georgette bridal saree lavishly adorned with freshwater pearl beadwork, silver resham, and scalloped edges.',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80',
        5,
        true
    )
ON CONFLICT DO NOTHING;
