/**
 * Database query functions for Iroshi Dress Maker.
 *
 * Performance-optimized:
 * - Uses `createPublicClient` (no cookies opt-out, enables ISR & edge caching)
 * - Cached via Next.js `unstable_cache` with revalidation tags
 *
 * Server-side use only (import in Server Components or Route Handlers).
 */
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/server'
import type {
  Category,
  Dress,
  DressImage,
  FeaturedImage,
  CollectionItem,
  PortfolioBackground,
  SiteSettings,
} from '@/types'
import { PORTFOLIO_COLLECTION, type PortfolioItem } from '@/data/portfolio-items'

/** Check if Supabase environment variables are properly configured. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes('xxxxxxxxxxxx') && url.startsWith('http'))
}

// ---------------------------------------------------------------------------
// SITE SETTINGS
// ---------------------------------------------------------------------------

/**
 * Fetch the single site_settings row.
 * Cached for 60 seconds.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('[getSiteSettings] error:', error.message)
        return null
      }
      return data
    } catch {
      return null
    }
  },
  ['site_settings_cache'],
  { revalidate: 60, tags: ['site_settings'] }
)

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

/** Fetch all categories. Cached for 120 seconds. */
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.warn('[getCategories] error:', error.message)
        return []
      }
      return data ?? []
    } catch {
      return []
    }
  },
  ['categories_cache'],
  { revalidate: 120, tags: ['categories'] }
)

/** Fetch a single category by slug. */
export const getCategoryBySlug = unstable_cache(
  async (slug: string): Promise<Category | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        console.warn('[getCategoryBySlug] error:', error.message)
        return null
      }
      return data
    } catch {
      return null
    }
  },
  ['category_by_slug_cache'],
  { revalidate: 120, tags: ['categories'] }
)

// ---------------------------------------------------------------------------
// DRESSES
// ---------------------------------------------------------------------------

/** Fetch featured dresses for the homepage (active dresses, by category). */
export const getFeaturedDresses = unstable_cache(
  async (categorySlug: string, limit = 3): Promise<Dress[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const category = await getCategoryBySlug(categorySlug)
      if (!category) return []

      const { data, error } = await supabase
        .from('dresses')
        .select(`
          *,
          category:categories(*),
          images:dress_images(*)
        `)
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.warn('[getFeaturedDresses] error:', error.message)
        return []
      }
      return (data ?? []) as Dress[]
    } catch {
      return []
    }
  },
  ['featured_dresses_cache'],
  { revalidate: 60, tags: ['dresses'] }
)

/** Fetch all active dresses in a category. */
export const getDressesByCategory = unstable_cache(
  async (categorySlug: string): Promise<Dress[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const category = await getCategoryBySlug(categorySlug)
      if (!category) return []

      const { data, error } = await supabase
        .from('dresses')
        .select(`
          *,
          category:categories(*),
          images:dress_images(*)
        `)
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('[getDressesByCategory] error:', error.message)
        return []
      }
      return (data ?? []) as Dress[]
    } catch {
      return []
    }
  },
  ['dresses_by_category_cache'],
  { revalidate: 60, tags: ['dresses'] }
)

/** Fetch a single dress by dress_code. */
export const getDressByCode = unstable_cache(
  async (dressCode: string): Promise<Dress | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('dresses')
        .select(`
          *,
          category:categories(*),
          images:dress_images(*)
        `)
        .eq('dress_code', dressCode)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.warn('[getDressByCode] error:', error.message)
        return null
      }
      return data as Dress | null
    } catch {
      return null
    }
  },
  ['dress_by_code_cache'],
  { revalidate: 60, tags: ['dresses'] }
)

/** Fetch all dress codes (for static path generation). */
export const getAllDressCodes = unstable_cache(
  async (): Promise<string[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('dresses')
        .select('dress_code')
        .eq('is_active', true)

      if (error) {
        console.warn('[getAllDressCodes] error:', error.message)
        return []
      }
      return (data ?? []).map((d) => d.dress_code)
    } catch {
      return []
    }
  },
  ['all_dress_codes_cache'],
  { revalidate: 120, tags: ['dresses'] }
)

// ---------------------------------------------------------------------------
// DRESS IMAGES
// ---------------------------------------------------------------------------

/** Fetch all images for a dress, ordered by image_order. */
export const getDressImages = unstable_cache(
  async (dressId: string): Promise<DressImage[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('dress_images')
        .select('*')
        .eq('dress_id', dressId)
        .order('image_order', { ascending: true })

      if (error) {
        console.warn('[getDressImages] error:', error.message)
        return []
      }
      return data ?? []
    } catch {
      return []
    }
  },
  ['dress_images_cache'],
  { revalidate: 120, tags: ['dress_images'] }
)

/** Get the primary (lowest image_order) image URL for a dress. */
export function getPrimaryImageUrl(images: DressImage[]): string | null {
  if (!images || images.length === 0) return null
  const sorted = [...images].sort((a, b) => a.image_order - b.image_order)
  return sorted[0].image_url
}

// ---------------------------------------------------------------------------
// FEATURED HERO IMAGES (HOMEPAGE 7-CARD ROTATION)
// ---------------------------------------------------------------------------

/**
 * Fetch all active featured images for the homepage hero rotation.
 * Returns empty array if table doesn't exist yet or has no rows.
 */
export const getFeaturedImages = unstable_cache(
  async (): Promise<FeaturedImage[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('featured_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) {
        if (!error.message.includes('does not exist') && !error.message.includes('schema cache')) {
          console.warn('[getFeaturedImages] error:', error.message)
        }
        return []
      }
      return (data ?? []) as FeaturedImage[]
    } catch {
      return []
    }
  },
  ['featured_images_cache'],
  { revalidate: 60, tags: ['featured_images'] }
)

// ---------------------------------------------------------------------------
// LATEST & SAREE COLLECTION ITEMS (DATABASE DRIVEN)
// ---------------------------------------------------------------------------

/**
 * Fetch raw published Latest Collection items from Supabase table `latest_collection_items`.
 */
export const getLatestCollectionDatabaseItems = unstable_cache(
  async (): Promise<CollectionItem[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('latest_collection_items')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        if (!error.message.includes('does not exist') && !error.message.includes('schema cache')) {
          console.warn('[getLatestCollectionDatabaseItems] error:', error.message)
        }
        return []
      }
      return (data || []) as CollectionItem[]
    } catch {
      return []
    }
  },
  ['latest_collection_db_items_cache'],
  { revalidate: 60, tags: ['latest_collection'] }
)

/**
 * Fetch raw published Saree Collection items from Supabase table `saree_collection_items`.
 */
export const getSareeCollectionDatabaseItems = unstable_cache(
  async (): Promise<CollectionItem[]> => {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('saree_collection_items')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        if (!error.message.includes('does not exist') && !error.message.includes('schema cache')) {
          console.warn('[getSareeCollectionDatabaseItems] error:', error.message)
        }
        return []
      }
      return (data || []) as CollectionItem[]
    } catch {
      return []
    }
  },
  ['saree_collection_db_items_cache'],
  { revalidate: 60, tags: ['saree_collection'] }
)

function mapCollectionItemToPortfolioItem(item: CollectionItem, fallbackIdx: number): PortfolioItem {
  const fallback = PORTFOLIO_COLLECTION[fallbackIdx % PORTFOLIO_COLLECTION.length]
  return {
    id: item.id,
    name: item.title?.trim() || fallback?.name || `Look #${fallbackIdx + 1}`,
    price: fallback?.price || 'Bespoke Order',
    originalPrice: fallback?.originalPrice,
    image: item.image_url,
    fallbackColor: fallback?.fallbackColor || 'from-neutral-900 to-amber-950',
    description: item.description?.trim() || fallback?.description || 'Handcrafted bespoke haute couture created at Iroshi Dressmaker atelier.',
    fabric: fallback?.fabric || 'Imported Silk & Organza',
    craft: item.subtitle_badge?.trim() || fallback?.craft || 'Handcrafted Couture',
    origin: fallback?.origin || 'Colombo Atelier',
    colorName: fallback?.colorName || 'Bespoke Palette',
    accentHex: fallback?.accentHex || '#c8324b',
    tags: fallback?.tags || ['Bespoke', 'Couture'],
  }
}

/**
 * Fetch unified Latest Collection items for the Home and Portfolio showcases.
 * Reads from `latest_collection_items`, falling back to `latest_collection_images`
 * or `PORTFOLIO_COLLECTION` if table is empty.
 */
export async function getLatestCollectionItems(): Promise<PortfolioItem[]> {
  const items = await getLatestCollectionDatabaseItems()
  if (items && items.length > 0) {
    return items.map((item, idx) => mapCollectionItemToPortfolioItem(item, idx))
  }
  return PORTFOLIO_COLLECTION
}

/**
 * Fetch unified Saree Collection items for the Portfolio showcase.
 * Reads from `saree_collection_items`, falling back to `PORTFOLIO_COLLECTION` if empty.
 */
export async function getSareeCollectionItems(): Promise<PortfolioItem[]> {
  const items = await getSareeCollectionDatabaseItems()
  if (items && items.length > 0) {
    return items.map((item, idx) => mapCollectionItemToPortfolioItem(item, idx))
  }
  return PORTFOLIO_COLLECTION
}

// ---------------------------------------------------------------------------
// PORTFOLIO BACKGROUNDS
// ---------------------------------------------------------------------------

/**
 * Fetch the portfolio_backgrounds settings row from Supabase.
 * Returns null if not configured or table doesn't exist yet.
 */
export const getPortfolioBackground = unstable_cache(
  async (): Promise<PortfolioBackground | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('portfolio_backgrounds')
        .select('id, active_theme, classic_pos_x, classic_pos_y, custom_pos_x, custom_pos_y, updated_at')
        .limit(1)
        .maybeSingle()

      if (error) {
        if (!error.message.includes('does not exist') && !error.message.includes('schema cache')) {
          console.error('[getPortfolioBackground] error:', error.message)
        }
        return null
      }
      if (!data) return null

      // Transform oversized base64 data URLs to use the lightweight /api/portfolio-bg/[theme] endpoint.
      // This prevents inlining ~5MB of raw base64 data into every HTML document.
      return {
        id: data.id,
        active_theme: (data.active_theme as 'classic' | 'custom') || 'classic',
        classic_url: '/api/portfolio-bg/classic',
        custom_url: '/api/portfolio-bg/custom',
        classic_pos_x: data.classic_pos_x,
        classic_pos_y: data.classic_pos_y,
        custom_pos_x: data.custom_pos_x,
        custom_pos_y: data.custom_pos_y,
        updated_at: data.updated_at,
      }
    } catch {
      return null
    }
  },
  ['portfolio_background_cache'],
  { revalidate: 60, tags: ['portfolio_backgrounds'] }
)
