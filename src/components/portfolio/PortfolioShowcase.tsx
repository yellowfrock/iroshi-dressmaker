'use client'

import React, { useState, useEffect } from 'react'
import type { PortfolioItem } from '@/data/portfolio-items'
import type { PortfolioBackground } from '@/types'
import { DualScrollBackground } from './DualScrollBackground'
import { GlassToggle } from './GlassToggle'
import LatestCollection from './LatestCollection'
import './portfolio.css'

const DEFAULT_CLASSIC_BG = '/portfolio/background.jpg'
const DEFAULT_CUSTOM_BG = '/portfolio/custom-background.png'

interface PortfolioShowcaseProps {
  initialBackground?: PortfolioBackground | null
  waUrl?: string
  latestCollectionItems?: PortfolioItem[]
  sareeCollectionItems?: PortfolioItem[]
}

/**
 * PortfolioShowcase — orchestrator client component that composes:
 * - DualScrollBackground (full-page fixed background via React portal)
 * - Hero Header ("Our Portfolio" title, description, buttons)
 * - GlassToggle (positioned directly below the hero buttons row)
 * - Saree Collection & Latest Collection showcase
 */
export default function PortfolioShowcase({
  initialBackground,
  waUrl,
  latestCollectionItems,
  sareeCollectionItems,
}: PortfolioShowcaseProps) {
  // ---------- Background toggle & state ----------
  const [isCustom, setIsCustom] = useState<boolean>(initialBackground?.active_theme === 'custom')
  const [bgClassic, setBgClassic] = useState<string>(initialBackground?.classic_url || DEFAULT_CLASSIC_BG)
  const [bgCustom, setBgCustom] = useState<string>(initialBackground?.custom_url || DEFAULT_CUSTOM_BG)
  const [classicPosition, setClassicPosition] = useState<{ x: number; y: number }>({
    x: initialBackground?.classic_pos_x !== undefined ? Number(initialBackground.classic_pos_x) : 50,
    y: initialBackground?.classic_pos_y !== undefined ? Number(initialBackground.classic_pos_y) : 0,
  })
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number }>({
    x: initialBackground?.custom_pos_x !== undefined ? Number(initialBackground.custom_pos_x) : 50,
    y: initialBackground?.custom_pos_y !== undefined ? Number(initialBackground.custom_pos_y) : 0,
  })

  // Hydration-safe localStorage sync for visitor session preferences
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('portfolio_bg_theme')
      if (savedTheme === 'custom') setIsCustom(true)
      else if (savedTheme === 'classic') setIsCustom(false)

      const savedClassic = localStorage.getItem('portfolio_bg_classic')
      if (savedClassic) setBgClassic(savedClassic)

      const savedCustom = localStorage.getItem('portfolio_bg_custom')
      if (savedCustom) setBgCustom(savedCustom)

      const savedClassicPos = localStorage.getItem('portfolio_bg_classic_pos')
      if (savedClassicPos) setClassicPosition(JSON.parse(savedClassicPos))

      const savedCustomPos = localStorage.getItem('portfolio_bg_custom_pos')
      if (savedCustomPos) setCustomPosition(JSON.parse(savedCustomPos))
    } catch {
      // localStorage unavailable
    }
  }, [])

  const handleToggleCustom = (nextVal: boolean) => {
    setIsCustom(nextVal)
    try {
      localStorage.setItem('portfolio_bg_theme', nextVal ? 'custom' : 'classic')
    } catch {}
  }

  // ---------- Scroll progress for footer bar ----------
  const [scrollProgress, setScrollProgress] = useState<number>(0)

  const activeWaUrl = waUrl || 'https://wa.me/94769750186'

  return (
    <>
      {/* Full-page fixed scroll-driven background (portals to document.body) */}
      <DualScrollBackground
        imageUrlClassic={bgClassic}
        imageUrlCustom={bgCustom}
        isCustom={isCustom}
        heightScale={1.6}
        lerpFactor={0.08}
        overlayOpacity={0.45}
        classicPosition={classicPosition}
        customPosition={customPosition}
        onProgressChange={(progress) => setScrollProgress(progress)}
      />

      {/* Portfolio Hero Header */}
      <div className="relative pt-[clamp(32px,5vh,56px)] pb-0 px-4 sm:px-8 lg:px-12 overflow-hidden text-center">
        {/* Ambient subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(244, 211, 137, 0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono tracking-widest uppercase text-[#F4D389] mb-4 sm:mb-5 shadow-sm">
            <span>Atelier Lookbook &amp; Bespoke Archive</span>
          </div>

          <h1 className="text-[clamp(2.2rem,5.5vw,4.2rem)] font-light leading-[1.08] tracking-tight mb-4 sm:mb-5 text-white drop-shadow-md">
            Our <span className="font-serif italic font-medium text-[#F4D389]">Portfolio</span>
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm md:text-base text-white/70 font-light leading-relaxed">
            A curated monograph of handcrafted bridal gowns, ethereal reception silhouettes, and exclusive evening rentals crafted by Indira Iroshini. Each creation reflects decades of artisanal precision, imported fabrics, and tailored perfection.
          </p>

          {/* Quick Actions & Anchors */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-6 sm:mt-7">
            <a
              id="portfolio-view-full-collection-btn"
              href="https://www.behance.net/indirairoshini"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-[11px] sm:text-xs font-mono tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(244,211,137,0.3)] no-underline flex items-center gap-1.5 active:scale-95"
            >
              <span>View Full Collection</span>
              <span>↗</span>
            </a>
            <a
              href="#latest-collection"
              className="px-4 sm:px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] sm:text-xs font-mono tracking-wider uppercase text-white/80 hover:text-white transition-all no-underline"
            >
              Latest Collection ↓
            </a>
            <a
              href="#saree-collection"
              className="px-4 sm:px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] sm:text-xs font-mono tracking-wider uppercase text-white/80 hover:text-white transition-all no-underline"
            >
              Saree Collection ↓
            </a>
            <a
              href={activeWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-5 py-2 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-[11px] sm:text-xs font-mono tracking-wider uppercase font-semibold text-white transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] no-underline"
            >
              Book Private Fitting
            </a>
          </div>

          {/* Glass toggle ("Blue's"/"Yellow's") directly below buttons */}
          <div
            className="flex items-center justify-center"
            style={{ marginTop: 'clamp(20px, 3vh, 32px)' }}
          >
            <GlassToggle
              checked={isCustom}
              onChange={handleToggleCustom}
              offLabel="Blue's"
              onLabel="Yellow's"
            />
          </div>
        </div>
      </div>

      {/* Latest Collection Section (with Saree Collection Focus Carousel below) */}
      <LatestCollection
        id="latest-collection"
        heading="Latest Collection"
        description="A prestigious showcase of our latest handcrafted creations, ethereal reception silhouettes, and bespoke bridal masterworks."
        variant="portfolio"
        items={latestCollectionItems}
        sareeItems={sareeCollectionItems}
        showCarousel={true}
        scrollProgress={scrollProgress}
        isCustom={isCustom}
      />
    </>
  )
}

