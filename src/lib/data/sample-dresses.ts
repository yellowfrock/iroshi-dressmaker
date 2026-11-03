import type { Dress } from '@/types'

export const sampleDresses: Dress[] = [
  {
    id: 'sample-br001',
    dress_code: 'BR001',
    name: 'The Royal Alençon Lace Ballgown',
    category_id: 'sample-cat-bridal',
    description:
      'Handcrafted French Alençon lace paired with multi-tiered silk tulle. Featuring an illusion sweetheart neckline, delicate cap sleeves, and a 2.5-meter cathedral train with hand-appliquéd floral lace motifs. Perfect for a grand church ceremony or ballroom reception.',
    availability: 'available',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-bridal',
      name: 'Bridal',
      slug: 'bridal',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-br001-1',
        dress_id: 'sample-br001',
        image_url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'img-br001-2',
        dress_id: 'sample-br001',
        image_url: 'https://images.unsplash.com/photo-1549416864-228c58296a3d?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'img-br001-3',
        dress_id: 'sample-br001',
        image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 2,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'sample-br002',
    dress_code: 'BR002',
    name: 'Silk Organza A-Line with Hand Pearl Beading',
    category_id: 'sample-cat-bridal',
    description:
      'Airy pure silk organza silhouette adorned with thousands of individually hand-stitched seed pearls and crystal beads along the bodice. Modern square neckline with romantic flowing skirt that captures natural light effortlessly.',
    availability: 'available',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-bridal',
      name: 'Bridal',
      slug: 'bridal',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-br002-1',
        dress_id: 'sample-br002',
        image_url: 'https://images.unsplash.com/photo-1546804784-896d0d517245?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'img-br002-2',
        dress_id: 'sample-br002',
        image_url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'sample-br003',
    dress_code: 'BR003',
    name: 'Minimalist Crepe Mermaid Gown with Low Back',
    category_id: 'sample-cat-bridal',
    description:
      'Impeccably tailored heavy Italian stretch crepe that contours the body before flaring gracefully at the knee. Features a dramatic low scoop back accented with covered silk buttons cascading all the way to the hem of the chapel-length train.',
    availability: 'available',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-bridal',
      name: 'Bridal',
      slug: 'bridal',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-br003-1',
        dress_id: 'sample-br003',
        image_url: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'sample-br004',
    dress_code: 'BR004',
    name: 'Illusion Neckline Tulle Princess Gown',
    category_id: 'sample-cat-bridal',
    description:
      'Fairytale gown featuring fine Chantilly lace beneath soft sparkling shimmer tulle. Illusion boatneck bodice, delicately structured internal corset, and romantic off-the-shoulder draped sleeves.',
    availability: 'unavailable',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-bridal',
      name: 'Bridal',
      slug: 'bridal',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-br004-1',
        dress_id: 'sample-br004',
        image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
  },

  // -------------------------------------------------------------------------
  // RENTAL COLLECTION
  // -------------------------------------------------------------------------
  {
    id: 'sample-rn001',
    dress_code: 'RN001',
    name: 'Emerald Velvet Evening & Reception Gown',
    category_id: 'sample-cat-rental',
    description:
      'Luxurious deep emerald green silk velvet gown featuring an asymmetrical draped neckline and thigh-high side slit. Tailored for second-day wedding receptions, formal galas, and engagement dinners.',
    availability: 'available',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-rental',
      name: 'Rental',
      slug: 'rental',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-rn001-1',
        dress_id: 'sample-rn001',
        image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'sample-rn002',
    dress_code: 'RN002',
    name: 'Gold Zari Embellished Fusion Reception Gown',
    category_id: 'sample-cat-rental',
    description:
      'Exquisite champagne gold gown handcrafted with metallic bullion embroidery, Swarovski stones, and delicate sequin borders. Comes with a matching sheer capelet.',
    availability: 'available',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-rental',
      name: 'Rental',
      slug: 'rental',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-rn002-1',
        dress_id: 'sample-rn002',
        image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'sample-rn003',
    dress_code: 'RN003',
    name: 'Blush Rose Embroidered Bridesmaid Gown',
    category_id: 'sample-cat-rental',
    description:
      'Romantic blush rose chiffon gown with pleated bodice and delicate floral threadwork along the waistline. Available in multiple sizes for bridal parties and maid of honor rentals.',
    availability: 'available',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-rental',
      name: 'Rental',
      slug: 'rental',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-rn003-1',
        dress_id: 'sample-rn003',
        image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'sample-rn004',
    dress_code: 'RN004',
    name: 'Midnight Navy Shimmer Halter Evening Gown',
    category_id: 'sample-cat-rental',
    description:
      'Sophisticated midnight navy gown with iridescent micro-glitter woven through fine jersey. Halter neck with an open cross-back design and a fluid A-line drape.',
    availability: 'unavailable',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'sample-cat-rental',
      name: 'Rental',
      slug: 'rental',
      created_at: new Date().toISOString(),
    },
    images: [
      {
        id: 'img-rn004-1',
        dress_id: 'sample-rn004',
        image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
        storage_path: 'sample',
        image_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
  },
]
