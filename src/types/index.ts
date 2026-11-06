/**
 * TypeScript type definitions for Iroshi Dress Maker.
 * These types mirror the Supabase database schema.
 */

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export type DressAvailability = 'available' | 'unavailable'

export interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Dress {
  id: string
  dress_code: string
  name: string
  category_id: string
  description: string | null
  availability: DressAvailability
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined from categories (optional)
  category?: Category
  // Joined from dress_images (optional)
  images?: DressImage[]
}

export interface DressImage {
  id: string
  dress_id: string
  image_url: string
  storage_path: string
  image_order: number
  created_at: string
}

export type FeaturedImageSource = 'manual' | 'behance'

export interface FeaturedImage {
  id: string
  image_url: string
  source: FeaturedImageSource
  source_link: string | null
  is_active: boolean
  display_order: number | null
  created_at: string
}

export type LatestCollectionImageSource = 'upload' | 'manual' | 'behance'

export interface LatestCollectionImage {
  id: string
  image_url: string
  title: string | null
  source: LatestCollectionImageSource
  source_link: string | null
  is_active: boolean
  display_order: number | null
  created_at: string
}

export interface CollectionItem {
  id: string
  title: string
  subtitle_badge: string | null
  description: string | null
  image_url: string
  image_path: string | null
  detail_url: string | null
  images?: string[] | null
  sort_order: number
  is_published: boolean
  saree_code?: string | null
  created_at: string
  updated_at: string
}

export type LatestCollectionItem = CollectionItem
export type SareeCollectionItem = CollectionItem

export interface SiteSettings {
  id: string
  whatsapp_number: string | null
  business_name: string | null
  contact_email: string | null
  phone_number: string | null
  address: string | null
  instagram_url: string | null
  facebook_url: string | null
  updated_at: string
}

export interface PortfolioBackground {
  id?: string
  classic_url: string
  custom_url: string
  classic_pos_x?: number
  classic_pos_y?: number
  custom_pos_x?: number
  custom_pos_y?: number
  active_theme?: 'classic' | 'custom'
  updated_at?: string
}

// ---------------------------------------------------------------------------
// API / utility types
// ---------------------------------------------------------------------------

/** A dress with its primary image URL resolved (convenience type for UI) */
export interface DressWithPrimaryImage extends Dress {
  primaryImageUrl: string | null
}

/** Props for WhatsApp button components */
export interface WhatsAppButtonProps {
  dressId?: string
  dressName?: string
  whatsappNumber: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: Partial<Category>
        Update: Partial<Category>
        Relationships: []
      }
      dresses: {
        Row: Dress
        Insert: Partial<Dress>
        Update: Partial<Dress>
        Relationships: [
          {
            foreignKeyName: 'dresses_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      dress_images: {
        Row: DressImage
        Insert: Partial<DressImage>
        Update: Partial<DressImage>
        Relationships: [
          {
            foreignKeyName: 'dress_images_dress_id_fkey'
            columns: ['dress_id']
            isOneToOne: false
            referencedRelation: 'dresses'
            referencedColumns: ['id']
          }
        ]
      }
      site_settings: {
        Row: SiteSettings
        Insert: Partial<SiteSettings>
        Update: Partial<SiteSettings>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
