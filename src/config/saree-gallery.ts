/**
 * Saree Collection Gallery Configuration
 *
 * Each saree is keyed by its saree_code (e.g. "SR-001", "SR-002", etc.).
 *
 * How to use:
 * - Each saree has an array of image URLs: [frontView, detailView, ...]
 * - To add or replace the second (detail) image for any saree, simply replace
 *   the second URL in that saree's array below.
 * - If a saree has 2 or more images, the lightbox displays:
 *   - Next / Previous arrow buttons
 *   - Keyboard navigation (Left / Right arrow keys)
 *   - Mobile touch swipe navigation
 *   - Interactive bottom thumbnail strip
 *   - Image counter (e.g. "1 / 2")
 * - If a saree has only 1 image in the array, the arrows, counter and thumbnails
 *   are automatically hidden, displaying that single image enlarged.
 */

export const SAREE_GALLERY_IMAGES: Record<string, string[]> = {
  // SR-001 — Royal Kanchipuram Gold Saree
  'SR-001': [
    'https://nomdfldpzblimzdrccxl.supabase.co/storage/v1/object/public/collection-images/saree/1790785828615_be19fa0f9645e44a0b5108dfe5bcc298.jpg',
    // ⬇️ Add / replace second image for SR-001 here:
    'https://nomdfldpzblimzdrccxl.supabase.co/storage/v1/object/public/collection-images/saree/1790785828615_be19fa0f9645e44a0b5108dfe5bcc298.jpg',
  ],

  // SR-002 — Emerald Velvet Bridal Saree
  'SR-002': [
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
    // ⬇️ Add / replace second image for SR-002 here:
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
  ],

  // SR-003 — Rose Gold Organza Saree
  'SR-003': [
    'https://nomdfldpzblimzdrccxl.supabase.co/storage/v1/object/public/collection-images/saree/1790785845817_212ede521c33ef655627c5d00a0cb7eb__1_.jpg',
    // ⬇️ Add / replace second image for SR-003 here:
    'https://nomdfldpzblimzdrccxl.supabase.co/storage/v1/object/public/collection-images/saree/1790785845817_212ede521c33ef655627c5d00a0cb7eb__1_.jpg',
  ],

  // SR-004 — Midnight Sapphire Silk Saree
  'SR-004': [
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
    // ⬇️ Add / replace second image for SR-004 here:
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
  ],

  // SR-005 — Ivory Pearl Bridal Saree
  'SR-005': [
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80',
    // ⬇️ Add / replace second image for SR-005 here:
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80',
  ],
}

/**
 * Resolves the images for a saree card.
 * Priority:
 * 1. Matching saree_code in SAREE_GALLERY_IMAGES
 * 2. saree.images array (if present from API)
 * 3. saree.image_url (single image fallback)
 */
export function getSareeImages(sareeCode: string, fallbackUrl?: string | null): string[] {
  const configured = SAREE_GALLERY_IMAGES[sareeCode]
  if (configured && configured.length > 0) {
    return configured
  }
  if (fallbackUrl) {
    return [fallbackUrl]
  }
  return []
}

