-- ============================================================
-- Iroshi Dress Maker — COMPLETE ALL-IN-ONE SUPABASE SETUP
-- ============================================================
-- Run this ENTIRE script in your Supabase project SQL Editor:
-- https://supabase.com/dashboard/project/nomdfldpzblimzdrccxl/sql/new
--
-- This script automatically:
-- 1. Enables UUID extension
-- 2. Creates tables: categories, dresses, dress_images, site_settings
-- 3. Sets up Row Level Security (RLS) policies
-- 4. Creates public Storage buckets: 'dress-images' & '360-sequence'
-- 5. Seeds categories: 'Bridal' & 'Rental'
-- 6. Seeds 8 Haute-Couture dresses with multi-angle photos
-- 7. Seeds atelier contact settings and WhatsApp number
-- ============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLES DEFINITIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dresses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dress_code   TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description  TEXT,
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'unavailable')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dresses_updated_at ON dresses;
CREATE TRIGGER dresses_updated_at
  BEFORE UPDATE ON dresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

CREATE TABLE IF NOT EXISTS site_settings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_number  TEXT,
  business_name    TEXT DEFAULT 'Iroshi Dress Maker',
  contact_email    TEXT,
  phone_number     TEXT,
  address          TEXT,
  instagram_url    TEXT,
  facebook_url     TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE dresses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dress_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated write categories" ON categories;
CREATE POLICY "Authenticated write categories" ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Dresses policies
DROP POLICY IF EXISTS "Public read active dresses" ON dresses;
CREATE POLICY "Public read active dresses" ON dresses FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin read all dresses" ON dresses;
CREATE POLICY "Admin read all dresses" ON dresses FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write dresses" ON dresses;
CREATE POLICY "Authenticated write dresses" ON dresses FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Dress images policies
DROP POLICY IF EXISTS "Public read dress images" ON dress_images;
CREATE POLICY "Public read dress images" ON dress_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dresses
      WHERE dresses.id = dress_images.dress_id
        AND dresses.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admin read all dress images" ON dress_images;
CREATE POLICY "Admin read all dress images" ON dress_images FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write dress images" ON dress_images;
CREATE POLICY "Authenticated write dress images" ON dress_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Site settings policies
DROP POLICY IF EXISTS "Public read site settings" ON site_settings;
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated write site settings" ON site_settings;
CREATE POLICY "Authenticated write site settings" ON site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 4. STORAGE BUCKETS (dress-images & 360-sequence)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('dress-images', 'dress-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('360-sequence', '360-sequence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage access policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read dress-images bucket'
  ) THEN
    CREATE POLICY "Public read dress-images bucket" ON storage.objects
      FOR SELECT USING (bucket_id = 'dress-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read 360-sequence bucket'
  ) THEN
    CREATE POLICY "Public read 360-sequence bucket" ON storage.objects
      FOR SELECT USING (bucket_id = '360-sequence');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated write dress-images bucket'
  ) THEN
    CREATE POLICY "Authenticated write dress-images bucket" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dress-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated update dress-images bucket'
  ) THEN
    CREATE POLICY "Authenticated update dress-images bucket" ON storage.objects
      FOR UPDATE TO authenticated USING (bucket_id = 'dress-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated delete dress-images bucket'
  ) THEN
    CREATE POLICY "Authenticated delete dress-images bucket" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'dress-images');
  END IF;
END $$;

-- ============================================================
-- 5. SEED CATEGORIES, DRESSES, IMAGES & SETTINGS
-- ============================================================

DO $$
DECLARE
  v_bridal_id UUID;
  v_rental_id UUID;
  v_dress_id  UUID;
BEGIN
  -- Insert categories
  INSERT INTO categories (name, slug) VALUES ('Bridal', 'bridal')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_bridal_id;

  INSERT INTO categories (name, slug) VALUES ('Rental', 'rental')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_rental_id;

  -- ------------------------------------------------------------
  -- BRIDAL GOWNS
  -- ------------------------------------------------------------

  -- BR001
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'BR001',
    'The Royal Alençon Lace Ballgown',
    v_bridal_id,
    'Handcrafted French Alençon lace paired with multi-tiered silk tulle. Featuring an illusion sweetheart neckline, delicate cap sleeves, and a 2.5-meter cathedral train with hand-appliquéd floral lace motifs. Perfect for a grand church ceremony or ballroom reception.',
    'available',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1000&q=80', 'sample/br001-1.jpg', 0),
    (v_dress_id, 'https://images.unsplash.com/photo-1549416864-228c58296a3d?auto=format&fit=crop&w=1000&q=80', 'sample/br001-2.jpg', 1),
    (v_dress_id, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80', 'sample/br001-3.jpg', 2);

  -- BR002
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'BR002',
    'Silk Organza A-Line with Hand Pearl Beading',
    v_bridal_id,
    'Airy pure silk organza silhouette adorned with thousands of individually hand-stitched seed pearls and crystal beads along the bodice. Modern square neckline with romantic flowing skirt that captures natural light effortlessly.',
    'available',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1546804784-896d0d517245?auto=format&fit=crop&w=1000&q=80', 'sample/br002-1.jpg', 0),
    (v_dress_id, 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1000&q=80', 'sample/br002-2.jpg', 1);

  -- BR003
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'BR003',
    'Minimalist Crepe Mermaid Gown with Low Back',
    v_bridal_id,
    'Impeccably tailored heavy Italian stretch crepe that contours the body before flaring gracefully at the knee. Features a dramatic low scoop back accented with covered silk buttons cascading all the way to the hem of the chapel-length train.',
    'available',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80', 'sample/br003-1.jpg', 0),
    (v_dress_id, 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80', 'sample/br003-2.jpg', 1);

  -- BR004
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'BR004',
    'Celestial Shimmer Tulle Off-Shoulder Gown',
    v_bridal_id,
    'Romantic draped off-the-shoulder corset bodice crafted from fine glitter tulle underlay. Embellished with subtle three-dimensional organza floral petals and shimmering micro-sequins.',
    'unavailable',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1000&q=80', 'sample/br004-1.jpg', 0);

  -- ------------------------------------------------------------
  -- RENTAL GOWNS
  -- ------------------------------------------------------------

  -- RN001
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'RN001',
    'Emerald Velvet Couture Evening Gown',
    v_rental_id,
    'Deep jewel-tone silk-blend velvet with structured internal boning and an asymmetrical draped neckline. Features a high thigh slit with subtle hand-placed jet crystal borders. An iconic red-carpet statement piece.',
    'available',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80', 'sample/rn001-1.jpg', 0),
    (v_dress_id, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80', 'sample/rn001-2.jpg', 1);

  -- RN002
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'RN002',
    'Champagne Metallic Plissé Pleated Reception Dress',
    v_rental_id,
    'Liquid-look metallic lamé fabric with knife-pleated sunburst detailing radiating from an empire waist. Features a plunging V-neckline with delicate crossover halter straps and a fluid floor-length hem.',
    'available',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80', 'sample/rn002-1.jpg', 0);

  -- RN003
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'RN003',
    'Midnight Sapphire Beaded Column Gown',
    v_rental_id,
    'Sleek column silhouette in deep midnight navy tulle entirely covered in hand-embroidered bugle beads and crystals in an art-deco geometric motif. High illusion neckline with cap sleeves.',
    'available',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80', 'sample/rn003-1.jpg', 0);

  -- RN004
  INSERT INTO dresses (dress_code, name, category_id, description, availability, is_active)
  VALUES (
    'RN004',
    'Crimson Silk Chiffon Draped Grecian Gown',
    v_rental_id,
    'Layer upon layer of sheer crimson pure silk chiffon draping from a gold-embroidered shoulder broach. Dramatic open cape effect with fluid movement that commands attention at any gala.',
    'available',
    true
  )
  ON CONFLICT (dress_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    availability = EXCLUDED.availability
  RETURNING id INTO v_dress_id;

  DELETE FROM dress_images WHERE dress_id = v_dress_id;
  INSERT INTO dress_images (dress_id, image_url, storage_path, image_order) VALUES
    (v_dress_id, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=80', 'sample/rn004-1.jpg', 0);

  -- ------------------------------------------------------------
  -- ATELIER SITE SETTINGS
  -- ------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1) THEN
    INSERT INTO site_settings (
      whatsapp_number,
      business_name,
      phone_number,
      address,
      instagram_url,
      facebook_url
    ) VALUES (
      '94769750186',
      'Iroshi Dress Maker',
      '+94 76 975 0186',
      'No. 42 Atelier Lane, Colombo & Kurunegala, Sri Lanka',
      'https://www.instagram.com/iroshidressmaker',
      'https://www.facebook.com/iroshidressmaker'
    );
  ELSE
    UPDATE site_settings SET
      whatsapp_number = '94769750186',
      business_name = 'Iroshi Dress Maker',
      phone_number = '+94 76 975 0186',
      address = 'No. 42 Atelier Lane, Colombo & Kurunegala, Sri Lanka';
  END IF;

END $$;

-- ============================================================
-- FEATURED IMAGES TABLE FOR HOMEPAGE HERO ROTATION
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

ALTER TABLE featured_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active featured images"
  ON featured_images FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin read all featured images"
  ON featured_images FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin write featured images"
  ON featured_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

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

-- =============================================================================
-- SECTION 9: LATEST COLLECTION IMAGES (PORTFOLIO)
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

ALTER TABLE public.latest_collection_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active latest collection images"
  ON public.latest_collection_images FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access latest collection images"
  ON public.latest_collection_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_latest_collection_images_active_order 
  ON public.latest_collection_images (is_active, display_order, created_at DESC);

-- =============================================================================
-- SECTION 10: LATEST & SAREE COLLECTION ITEMS WITH COLLECTION-IMAGES STORAGE
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

ALTER TABLE public.latest_collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published latest collection items" ON public.latest_collection_items;
CREATE POLICY "Public can view published latest collection items"
    ON public.latest_collection_items FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Admin full access to latest collection items" ON public.latest_collection_items;
CREATE POLICY "Admin full access to latest collection items"
    ON public.latest_collection_items FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Saree Collection table
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

ALTER TABLE public.saree_collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published saree collection items" ON public.saree_collection_items;
CREATE POLICY "Public can view published saree collection items"
    ON public.saree_collection_items FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Admin full access to saree collection items" ON public.saree_collection_items;
CREATE POLICY "Admin full access to saree collection items"
    ON public.saree_collection_items FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Storage Bucket: collection-images
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

-- Seed latest_collection_items
INSERT INTO public.latest_collection_items (title, subtitle_badge, description, image_url, sort_order, is_published)
VALUES
    ('Ivory Bridal Masterpiece', 'Hand-Beaded Couture', 'Hand-draped in imported French lace with pearl beading and cathedral-length train. Structured corset boning with silk organza overlay.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80', 1, true),
    ('Emerald Reception Gown', 'Zardosi Embroidery', 'Sculpted reception silhouette in emerald duchess satin with intricate zardosi embroidery and crystal accents.', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80', 2, true),
    ('Blush Evening Silhouette', 'Aari Hand Embroidery', 'Featherlight sheer drape in Italian organza with hand-embroidered scalloped edges and delicate sequin highlights.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80', 3, true),
    ('Sapphire Royal Gown', 'Hand-Woven Gold Thread', 'The crown jewel of the atelier — a sapphire gown distinguished by a kaleidoscopic bead-work bodice with gold thread detailing.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80', 4, true),
    ('Pearl Organza Couture', 'Pearl & Cutwork Embroidery', 'Crisp ethereal organza with artisanal hand-embroidered scalloped edges, micro-cutwork florals, and delicate pearl highlights.', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80', 5, true)
ON CONFLICT DO NOTHING;

-- Seed saree_collection_items
INSERT INTO public.saree_collection_items (title, subtitle_badge, description, image_url, sort_order, is_published)
VALUES
    ('Royal Kanchipuram Gold Saree', 'Pure Silk Brocade', 'Heirloom bridal drape woven with pure zari threads, temple borders, and contrast pallu hand-finished in Colombo atelier.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80', 1, true),
    ('Emerald Velvet Bridal Saree', 'Zardosi Embroidery', 'Deep forest emerald drape complemented by heavy zardosi borders, crystal stone work, and a bespoke embellished blouse.', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80', 2, true),
    ('Rose Gold Organza Saree', 'Aari Needlework', 'Featherweight organza embellished with subtle rose gold cutdana, pearl tassels, and delicate floral border embroidery.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80', 3, true),
    ('Midnight Sapphire Silk Saree', 'Antique Threadwork', 'Lustrous midnight blue raw silk with antique bullion knotting, regal peacock motifs, and shimmering pallu drape.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80', 4, true),
    ('Ivory Pearl Bridal Saree', 'Pearl & Resham', 'Ethereal ivory georgette bridal saree lavishly adorned with freshwater pearl beadwork, silver resham, and scalloped edges.', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80', 5, true)
ON CONFLICT DO NOTHING;



