/**
 * Portfolio Showcase Data
 *
 * Curated commission items displayed in the interactive accordion
 * and coverflow carousel on the portfolio page.
 */

export interface PortfolioItem {
  id: string
  name: string
  price: string
  originalPrice?: string
  image: string
  fallbackColor: string
  description: string
  fabric: string
  craft: string
  origin: string
  colorName: string
  accentHex: string
  tags: string[]
}

export const PORTFOLIO_COLLECTION: PortfolioItem[] = [
  {
    id: 'gown-bridal-ivory',
    name: 'Ivory Bridal Masterpiece',
    price: 'LKR 185,000',
    originalPrice: 'LKR 210,000',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    fallbackColor: 'from-rose-950 via-red-900 to-amber-950',
    description:
      'Hand-draped in imported French lace with pearl beading and cathedral-length train. Structured corset boning with silk organza overlay for an ethereal bridal silhouette.',
    fabric: 'French Lace & Silk Organza',
    craft: 'Hand-Beaded Couture',
    origin: 'Colombo Atelier',
    colorName: 'Ivory Pearl & Champagne',
    accentHex: '#c8324b',
    tags: ['Bridal Heirloom', 'Hand-Beaded', 'Custom Fit'],
  },
  {
    id: 'gown-reception-emerald',
    name: 'Emerald Reception Gown',
    price: 'LKR 145,000',
    originalPrice: 'LKR 165,000',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
    fallbackColor: 'from-emerald-950 via-teal-900 to-amber-950',
    description:
      'Sculpted reception silhouette in emerald duchess satin with intricate zardosi embroidery. Features a dramatic asymmetric drape and hand-stitched crystal accents.',
    fabric: 'Duchess Satin & Tulle',
    craft: 'Zardosi Embroidery',
    origin: 'Kurunegala Workshop',
    colorName: 'Forest Emerald & Burnished Gold',
    accentHex: '#15803d',
    tags: ['Reception Wear', 'Heavy Drape', 'Crystal Work'],
  },
  {
    id: 'gown-evening-blush',
    name: 'Blush Evening Silhouette',
    price: 'LKR 120,000',
    originalPrice: 'LKR 140,000',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    fallbackColor: 'from-pink-950 via-rose-900 to-stone-900',
    description:
      'Featherlight sheer drape in Italian organza with hand-embroidered scalloped edges and delicate sequin highlights that shimmer with each movement.',
    fabric: 'Italian Silk Organza',
    craft: 'Aari Hand Embroidery',
    origin: 'Colombo Atelier',
    colorName: 'Blush Rose & Champagne Sheen',
    accentHex: '#db2777',
    tags: ['Evening Wear', 'Featherlight', 'Airy Drape'],
  },
  {
    id: 'gown-royal-sapphire',
    name: 'Sapphire Royal Gown',
    price: 'LKR 195,000',
    originalPrice: 'LKR 225,000',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
    fallbackColor: 'from-indigo-950 via-blue-900 to-amber-950',
    description:
      'The crown jewel of the atelier — a sapphire gown distinguished by a kaleidoscopic bead-work bodice with hand-woven gold thread detailing and a flowing train.',
    fabric: 'Pure Mulberry Silk',
    craft: 'Hand-Woven Gold Thread',
    origin: 'Colombo Atelier',
    colorName: 'Sapphire Midnight & Peacock Gold',
    accentHex: '#2563eb',
    tags: ['Collector Edition', 'Gold Thread', 'Handwoven'],
  },
  {
    id: 'gown-organza-pearl',
    name: 'Pearl Organza Couture',
    price: 'LKR 135,000',
    originalPrice: 'LKR 155,000',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80',
    fallbackColor: 'from-stone-900 via-neutral-900 to-amber-950',
    description:
      'Crisp ethereal organza with artisanal hand-embroidered scalloped edges, micro-cutwork florals, and delicate pearl highlights that catch the light beautifully.',
    fabric: 'Korean Sheer Silk Organza',
    craft: 'Pearl & Cutwork Embroidery',
    origin: 'Kurunegala Workshop',
    colorName: 'Ivory Pearl & Brushed Gold',
    accentHex: '#d97706',
    tags: ['Contemporary Chic', 'Pearl Finish', 'Lightweight'],
  },
]

export interface CarouselItem {
  id: string
  image: string
  title: string
  badge: string
  alt?: string
}

export const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: 'carousel-1',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    title: 'BRIDAL EDIT',
    badge: 'NEW ARRIVALS',
    alt: 'Ivory Bridal Masterpiece',
  },
  {
    id: 'carousel-2',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
    title: 'RECEPTION GOWNS',
    badge: 'COUTURE COLLECTION',
    alt: 'Emerald Reception Gown',
  },
  {
    id: 'carousel-3',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    title: 'EVENING SILHOUETTES',
    badge: 'HAND EMBROIDERED',
    alt: 'Blush Evening Silhouette',
  },
  {
    id: 'carousel-4',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
    title: 'ROYAL COLLECTION',
    badge: 'GOLD THREAD WORK',
    alt: 'Sapphire Royal Gown',
  },
  {
    id: 'carousel-5',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80',
    title: 'ORGANZA COUTURE',
    badge: 'PEARL EMBROIDERY',
    alt: 'Pearl Organza Couture',
  },
  {
    id: 'carousel-6',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1200&q=80',
    title: 'ANTIQUE BROCADE',
    badge: 'LIMITED ARCHIVE',
    alt: 'Antique Gold Brocade Gown',
  },
  {
    id: 'carousel-7',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=80',
    title: 'ATELIER COUTURE',
    badge: 'EXCLUSIVE PIECE',
    alt: 'Deep Wine Ceremonial Gown',
  },
]
