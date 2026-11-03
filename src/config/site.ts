/**
 * Site-wide configuration.
 * Business-specific values (WhatsApp, contact, social) should be stored
 * in the Supabase `site_settings` table and fetched at runtime.
 * Values here are fallbacks / defaults only.
 */
export const siteConfig = {
  name: 'Iroshi Dress Maker',
  description:
    'Premium bridal and rental dress collection. View our exquisite dresses and enquire through WhatsApp.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://iroshi.lk',

  // Navigation links (public-facing)
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Our Portfolio', href: '/portfolio' },
    { label: 'Latest Collection', href: '/portfolio#latest-collection' },
    { label: 'Rental Collection', href: '/rental' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],

  // Placeholder — will be replaced by site_settings in Supabase
  placeholders: {
    whatsappNumber: '', // e.g. '94771234567'
    businessName: 'Iroshi Dress Maker',
    contactEmail: '',
    phoneNumber: '',
    address: '',
    instagramUrl: '',
    facebookUrl: '',
    businessHours: '',
  },
} as const

export type SiteConfig = typeof siteConfig
