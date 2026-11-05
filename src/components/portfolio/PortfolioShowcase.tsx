'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
          {/* Collection Quick Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-3.5 sm:mb-5">
            <Link
              href="/saree-collection"
              className="cta-button inline-flex items-center justify-center gap-1.5 text-center no-underline cursor-pointer min-h-[44px]"
            >
              <span>Saree Collection</span>
              <span className="text-[11px] sm:text-xs font-sans">↗</span>
            </Link>
            <Link
              href="/rental"
              className="cta-button-portfolio inline-flex items-center justify-center gap-1.5 text-center no-underline cursor-pointer min-h-[44px]"
            >
              <span>Rental Collection</span>
              <span className="text-[11px] sm:text-xs font-sans">↗</span>
            </Link>
          </div>

          <h1 className="text-[clamp(2.2rem,5.5vw,4.2rem)] font-light leading-[1.08] tracking-tight text-white drop-shadow-md">
            Our <span className="font-serif italic font-medium text-[#F4D389]">Portfolio</span>
          </h1>

          {/* Glass toggle ("Blue's"/"Yellow's") directly below heading */}
          <div
            className="flex items-center justify-center"
            style={{ marginTop: 'clamp(18px, 2.5vh, 28px)' }}
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
        showEyebrow={false}
        items={latestCollectionItems}
        sareeItems={sareeCollectionItems}
        showCarousel={true}
        scrollProgress={scrollProgress}
        isCustom={isCustom}
      />
    </>
  )
}

