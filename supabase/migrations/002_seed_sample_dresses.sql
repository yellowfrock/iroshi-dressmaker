-- ============================================================
-- Iroshi Dress Maker — Sample Dress Seed Data
-- Migration: 002_seed_sample_dresses
-- ============================================================
-- Run this SQL in your Supabase SQL editor to populate
-- initial haute-couture bridal and rental collections with multi-angle photos.
-- ============================================================

DO $$
DECLARE
  v_bridal_id UUID;
  v_rental_id UUID;
  v_dress_id  UUID;
BEGIN
  -- 1. Ensure categories exist and grab their IDs
  SELECT id INTO v_bridal_id FROM categories WHERE slug = 'bridal';
  IF v_bridal_id IS NULL THEN
    INSERT INTO categories (name, slug) VALUES ('Bridal', 'bridal') RETURNING id INTO v_bridal_id;
  END IF;

  SELECT id INTO v_rental_id FROM categories WHERE slug = 'rental';
  IF v_rental_id IS NULL THEN
    INSERT INTO categories (name, slug) VALUES ('Rental', 'rental') RETURNING id INTO v_rental_id;
  END IF;

  -- ============================================================
  -- BRIDAL COLLECTION
  -- ============================================================

  -- BR001: The Royal Alençon Lace Ballgown
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

  -- BR002: Silk Organza A-Line with Hand Pearl Beading
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

  -- BR003: Minimalist Crepe Mermaid Gown with Low Back
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

  -- BR004: Celestial Shimmer Tulle Off-Shoulder Gown
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

  -- ============================================================
  -- RENTAL COLLECTION
  -- ============================================================

  -- RN001: Emerald Velvet Couture Evening Gown
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

  -- RN002: Champagne Metallic Plissé Pleated Reception Dress
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

  -- RN003: Midnight Sapphire Beaded Column Gown
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

  -- RN004: Crimson Silk Chiffon Draped Grecian Gown
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

  -- ============================================================
  -- SITE SETTINGS
  -- ============================================================
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
  )
  ON CONFLICT (id) DO UPDATE SET
    whatsapp_number = EXCLUDED.whatsapp_number,
    phone_number = EXCLUDED.phone_number;

END $$;
