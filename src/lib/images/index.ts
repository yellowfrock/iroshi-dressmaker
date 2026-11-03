/**
 * Image storage utilities for Iroshi Dress Maker.
 * Handles image URL generation from Supabase Storage paths.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

/**
 * Get the public URL for an image stored in Supabase Storage.
 *
 * @param bucket - Storage bucket name (e.g. 'dress-images', '360-sequence')
 * @param path - File path within the bucket (e.g. 'ezgif-frame-001.webp')
 */
export function getStorageUrl(bucket: string, path: string): string {
  if (!SUPABASE_URL) {
    console.warn('[getStorageUrl] NEXT_PUBLIC_SUPABASE_URL not set')
    return ''
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Get the public URL for a 360° sequence frame.
 *
 * @param filename - Frame filename (e.g. 'ezgif-frame-001.webp')
 */
export function get360FrameUrl(filename: string): string {
  return getStorageUrl('360-sequence', filename)
}

/**
 * Get the public URL for a dress image.
 *
 * @param storagePath - Path stored in dress_images.storage_path
 */
export function getDressImageUrl(storagePath: string): string {
  return getStorageUrl('dress-images', storagePath)
}

/**
 * Placeholder image URL to display when a dress has no photos.
 */
export const FALLBACK_DRESS_IMAGE = '/images/dress-placeholder.svg'
