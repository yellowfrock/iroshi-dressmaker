'use client'

import React, { useState } from 'react'
import { PORTFOLIO_COLLECTION, CAROUSEL_ITEMS } from '@/data/portfolio-items'
import type { PortfolioItem, CarouselItem } from '@/data/portfolio-items'
import { CuratedAccordion } from './CuratedAccordion'
import { CoverflowCarousel } from './CoverflowCarousel'
import { QuickViewModal } from './QuickViewModal'
import './portfolio.css'

export interface LatestCollectionProps {
  /**
   * 'home': fully transparent wrapper and transparent card gaps, high-contrast headings
   * 'portfolio': classic portfolio page variant with optional coverflow carousel
   */
  variant?: 'home' | 'portfolio'
  id?: string
  heading?: string
  description?: string
  items?: PortfolioItem[]
  sareeItems?: PortfolioItem[]
  showCarousel?: boolean
  scrollProgress?: number
  isCustom?: boolean
  className?: string
  showEyebrow?: boolean
}

/**
 * LatestCollection — unified reusable image cards section.
 * Used on both the Home page (/) and the Portfolio page (/portfolio).
 *
 * Features:
 * - Full-width balanced accordion layout with equal left/right margins.
 * - Desktop: active card displays craft badge, title, and "View Details".
 * - Mobile: responsive vertical stack with tap/explore navigation.
 * - QuickViewModal for full garment specifications upon clicking "View Details".
 * - Transparent background on Home variant to let the canvas sequence show through.
 */
export default function LatestCollection({
  variant = 'portfolio',
  id = 'latest-collection',
  heading = 'Latest Collection',
  description = 'A prestigious showcase of our latest handcrafted creations, ethereal reception silhouettes, and bespoke bridal masterworks.',
  items,
  sareeItems,
  showCarousel = false,
  scrollProgress = 0,
  isCustom = false,
  className = '',
  showEyebrow = true,
}: LatestCollectionProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)

  const hasLoadedItems = items !== undefined
  const displayItems = hasLoadedItems ? items : PORTFOLIO_COLLECTION
  const isHome = variant === 'home'

  return (
    <section
      id={id}
      className={`portfolio-showcase relative z-10 w-full overflow-hidden select-none ${
        isHome
          ? 'bg-transparent py-14 sm:py-20 lg:py-28'
          : 'scroll-mt-20'
      } ${className}`}
      style={
        !isHome
          ? {
              paddingTop: 'clamp(24px, 3.5vh, 36px)',
              paddingBottom: 'clamp(24px, 4vh, 40px)',
            }
          : undefined
      }
    >
      {/* Centered header container */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 text-center">
        {showEyebrow && (
          <span
            className={`font-mono uppercase tracking-[0.2em] block mb-2 font-semibold ${
              isHome
                ? 'text-xs sm:text-sm text-[#F4D389] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]'
                : 'text-[11px] sm:text-xs text-[#F4D389]'
            }`}
          >
            Interactive Showcase
          </span>
        )}

        <h2
          className={`font-serif italic font-medium leading-tight mb-2.5 sm:mb-3 text-white ${
            isHome
              ? 'text-3xl sm:text-5xl lg:text-6xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]'
              : 'text-2xl sm:text-4xl lg:text-5xl drop-shadow-md'
          }`}
        >
          {heading}
        </h2>

        <p
          className={`max-w-2xl mx-auto font-light leading-relaxed ${
            isHome
              ? 'text-xs sm:text-sm md:text-base text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]'
              : 'text-xs sm:text-sm text-white/70'
          }`}
        >
          {description}
        </p>
      </div>

      {/* Full-width Accordion Row — transparent wrapper on home */}
      <div
        className={`relative z-10 w-full bg-transparent ${
          isHome ? 'pt-6 sm:pt-8 pb-10 sm:pb-14' : 'pt-1 pb-8 sm:pb-10'
        }`}
      >
        {displayItems.length === 0 ? (
          <div className="max-w-md mx-auto my-12 py-12 px-6 text-center text-white/60 font-mono text-xs border border-white/10 rounded-2xl bg-black/40 backdrop-blur-md">
            <span className="inline-block px-3 py-1 rounded-full bg-[#F4D389]/10 text-[#F4D389] text-[10px] tracking-widest uppercase mb-3 border border-[#F4D389]/20">
              Curated Showcase
            </span>
            <p className="text-white/80 text-sm font-sans mb-1">No items currently available in this collection.</p>
            <p className="text-white/40 text-xs">New bespoke creations are added regularly by our atelier.</p>
          </div>
        ) : (
          <CuratedAccordion
            items={displayItems}
            enableHoverExpand={true}
            onSelectItem={(item) => setSelectedItem(item)}
          />
        )}
      </div>

      {/* Optional Coverflow Carousel for Saree Collection (used on Portfolio) */}
      {showCarousel && (
        <div className="relative z-10 w-full py-2 sm:py-4">
          <CoverflowCarousel
            id="saree-collection"
            eyebrowLeft="SAREE"
            eyebrowRight="COLLECTION"
            ariaLabel="Saree Collection Focus Carousel"
            items={
              sareeItems && sareeItems.length > 0
                ? sareeItems.map((s, idx) => ({
                    id: s.id || `saree-${idx}`,
                    image: s.image,
                    title: s.name.toUpperCase(),
                    badge: (s.craft || 'SAREE COUTURE').toUpperCase(),
                    alt: s.name,
                  }))
                : CAROUSEL_ITEMS
            }
            onSelectCard={(card: CarouselItem) => {
              const pool = sareeItems && sareeItems.length > 0 ? sareeItems : displayItems
              const found = pool.find(
                (p) => p.id === card.id || p.name.toLowerCase().includes(card.title.toLowerCase())
              )
              if (found) setSelectedItem(found)
              else if (pool[0]) setSelectedItem(pool[0])
            }}
          />
        </div>
      )}

      {/* Optional scroll progress status bar */}
      {showCarousel && (
        <div className="relative z-10 py-4 px-6 text-xs text-neutral-500 flex items-center justify-center gap-4">
          <span>
            Background:{' '}
            <strong className="text-amber-300/80 font-medium">
              {isCustom ? "Yellow's" : "Blue's"}
            </strong>
          </span>
          <span className="text-neutral-700">·</span>
          <span>
            Scroll:{' '}
            <strong className="text-amber-300/80 font-mono">
              {Math.round(scrollProgress * 100)}%
            </strong>
          </span>
        </div>
      )}

      {/* Garment Quick View Modal */}
      <QuickViewModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  )
}
