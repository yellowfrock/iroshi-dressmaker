/**
 * General utility functions for Iroshi Dress Maker.
 */

/**
 * Format a dress availability string for display.
 */
export function formatAvailability(availability: 'available' | 'unavailable'): string {
  return availability === 'available' ? 'Available' : 'Unavailable'
}

/**
 * Generate a simple URL slug from a string.
 * e.g. 'Elegant Bridal Dress' → 'elegant-bridal-dress'
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Format a date string to a human-readable format.
 * e.g. '2026-09-27T00:00:00Z' → 'September 27, 2026'
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Pad a number to a given width with leading zeros.
 * e.g. padNumber(5, 3) → '005'
 */
export function padNumber(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

/**
 * Check if a string is a valid URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
