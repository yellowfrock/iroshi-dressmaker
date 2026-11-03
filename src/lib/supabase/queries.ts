/**
 * Database query functions for Iroshi Dress Maker.
 *
 * All data access goes through these functions — never write raw Supabase
 * queries directly in components.
 *
 * Server-side use only (import in Server Components or Route Handlers).
 */
import { createClient } from '@/lib/supabase/server'
import type { Category, Dress, DressImage, FeaturedImage, LatestCollectionImage, CollectionItem, PortfolioBackground, SiteSettings } from '@/types'
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
 * Returns null if not configured yet.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
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
}

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

/** Fetch all categories. */
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()
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
}

/** Fetch a single category by slug. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
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
}

// ---------------------------------------------------------------------------
// DRESSES
// ---------------------------------------------------------------------------

/** Fetch featured dresses for the homepage (active dresses, by category). */
export async function getFeaturedDresses(
  categorySlug: string,
  limit = 3
): Promise<Dress[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()

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
}

/** Fetch all active dresses in a category. */
export async function getDressesByCategory(categorySlug: string): Promise<Dress[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()

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
}

/** Fetch a single dress by dress_code. */
export async function getDressByCode(dressCode: string): Promise<Dress | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
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
}

/** Fetch all dress codes (for static path generation). */
export async function getAllDressCodes(): Promise<string[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()
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
}

// ---------------------------------------------------------------------------
// DRESS IMAGES
// ---------------------------------------------------------------------------

/** Fetch all images for a dress, ordered by image_order. */
export async function getDressImages(dressId: string): Promise<DressImage[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()
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
}

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
export async function getFeaturedImages(): Promise<FeaturedImage[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()
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
}

// ---------------------------------------------------------------------------
// LATEST & SAREE COLLECTION ITEMS (DATABASE DRIVEN)
// ---------------------------------------------------------------------------

/**
 * Fetch raw published Latest Collection items from Supabase table `latest_collection_items`.
 */
export async function getLatestCollectionDatabaseItems(): Promise<CollectionItem[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()
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
}

/**
 * Fetch raw published Saree Collection items from Supabase table `saree_collection_items`.
 */
export async function getSareeCollectionDatabaseItems(): Promise<CollectionItem[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const supabase = await createClient()
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
}

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
export async function getPortfolioBackground(): Promise<PortfolioBackground | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('portfolio_backgrounds')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      if (!error.message.includes('does not exist') && !error.message.includes('schema cache')) {
        console.error('[getPortfolioBackground] error:', error.message)
      }
      return null
    }
    return data as PortfolioBackground | null
  } catch {
    return null
  }
}





