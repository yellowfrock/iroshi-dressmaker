'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CarouselItem } from '@/data/portfolio-items'

interface CoverflowCarouselProps {
  items: CarouselItem[]
  autoAdvanceInterval?: number
  onSelectCard?: (item: CarouselItem) => void
  className?: string
  id?: string
  eyebrowLeft?: string
  eyebrowRight?: string
  ariaLabel?: string
}

/**
 * CoverflowCarousel — 3D perspective center-focus card carousel.
 * Auto-advances every ~2.5s with cubic-bezier easing.
 * Supports touch swipe on mobile and keyboard navigation.
 */
export const CoverflowCarousel: React.FC<CoverflowCarouselProps> = ({
  items,
  autoAdvanceInterval = 2500,
  onSelectCard,
  className = '',
  id = 'saree-collection',
  eyebrowLeft = 'SAREE',
  eyebrowRight = 'COLLECTION',
  ariaLabel = 'Saree Collection Focus Carousel',
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const touchStartXRef = useRef<number | null>(null)
  const touchDeltaXRef = useRef<number>(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const total = items.length

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total)
  }, [total])

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  // Auto-advance
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (isPaused) return

    const timer = setInterval(nextSlide, autoAdvanceInterval)
    return () => clearInterval(timer)
  }, [isPaused, autoAdvanceInterval, nextSlide])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextSlide()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prevSlide()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchDeltaXRef.current = 0
    setIsPaused(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current
  }

  const handleTouchEnd = () => {
    if (touchDeltaXRef.current < -40) nextSlide()
    else if (touchDeltaXRef.current > 40) prevSlide()
    touchStartXRef.current = null
    touchDeltaXRef.current = 0
    setIsPaused(false)
  }

  const getOffset = (index: number) => {
    let diff = index - activeIndex
    while (diff > Math.floor(total / 2)) diff -= total
    while (diff < -Math.floor((total - 1) / 2)) diff += total
    return diff
  }

  const activeItem = items[activeIndex] || items[0]

  return (
    <section
      id={id}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full py-16 sm:py-24 overflow-hidden select-none bg-transparent transition-colors scroll-mt-24 ${className}`}
    >
      {/* Ambient spotlight */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        {/* Eyebrow heading */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-between mb-8 sm:mb-12 px-6">
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-white/90 uppercase font-bold">
            {eyebrowLeft}
          </span>
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-white/60 uppercase font-bold">
            {eyebrowRight}
          </span>
        </div>

        {/* Carousel track */}
        <div
          ref={containerRef}
          className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] flex items-center justify-center"
          style={{ perspective: '1100px' }}
        >
          {items.map((item, index) => {
            const offset = getOffset(index)
            const isCenter = offset === 0
            const absOffset = Math.abs(offset)

            const translateX = offset * 58
            const scale = Math.max(0.6, 1 - absOffset * 0.22)
            const rotateY = offset > 0 ? -12 : offset < 0 ? 12 : 0
            const opacity = absOffset > 3 ? 0 : 1
            const zIndex = 30 - absOffset * 5
            const brightness = isCenter ? 1 : Math.max(0.35, 0.7 - absOffset * 0.18)
            const blur = isCenter ? 0 : Math.min(4, absOffset * 1.5)
            const pointerEvents = absOffset > 2 ? 'none' : 'auto'

            const transformStyle = `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={isCenter ? 0 : -1}
                aria-label={`View ${item.title}`}
                onClick={() => {
                  if (isCenter && onSelectCard) onSelectCard(item)
                  else setActiveIndex(index)
                }}
                className="absolute top-0 bottom-0 my-auto cursor-pointer w-[260px] sm:w-[320px] md:w-[350px] h-[360px] sm:h-[440px] md:h-[480px] rounded-[20px] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,.8,.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{
                  transform: transformStyle,
                  zIndex,
                  opacity,
                  filter: `brightness(${brightness}) blur(${blur}px)`,
                  pointerEvents: pointerEvents as React.CSSProperties['pointerEvents'],
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.alt || item.title}
                  decoding="async"
                  loading={isCenter ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover object-top select-none"
                  draggable={false}
                />

                {/* Glass highlight */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none" />

                {/* Bottom vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Center card glow */}
                {isCenter && (
                  <div className="absolute inset-0 rounded-[20px] border-2 border-white/30 pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.15)]" />
                )}
              </div>
            )
          })}

          {/* Nav buttons */}
          <button
            type="button"
            aria-label="Previous card"
            onClick={prevSlide}
            className="absolute left-4 sm:left-12 z-40 p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white/70 hover:text-white backdrop-blur-md transition-all active:scale-95 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next card"
            onClick={nextSlide}
            className="absolute right-4 sm:right-12 z-40 p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white/70 hover:text-white backdrop-blur-md transition-all active:scale-95 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Title + badge below carousel */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center text-center">
          <h3
            key={`title-${activeItem.id}`}
            className="font-mono text-xl sm:text-2xl tracking-[0.2em] text-white uppercase mb-3 animate-fadeIn drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-bold"
          >
            {activeItem.title}
          </h3>

          <div key={`badge-${activeItem.id}`} className="animate-fadeIn">
            <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-neutral-300 uppercase px-4 py-1 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm shadow-sm inline-block">
              {activeItem.badge}
            </span>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5 mt-5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* All Saree collection CTA button */}
          <div className="mt-7 sm:mt-8 mb-2 flex items-center justify-center">
            <Link
              href="/saree-collection"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-mono text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(216,27,43,0.35)] hover:shadow-[0_8px_30px_rgba(216,27,43,0.55)] transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D389] no-underline cursor-pointer"
            >
              <span>All Saree collection</span>
              <span className="text-sm font-sans" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
