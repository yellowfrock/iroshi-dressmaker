'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Eye, Sparkles, ChevronRight } from 'lucide-react'
import type { PortfolioItem } from '@/data/portfolio-items'

interface CuratedAccordionProps {
  items: PortfolioItem[]
  onSelectItem?: (item: PortfolioItem) => void
  enableHoverExpand?: boolean
  showVerticalTitles?: boolean
}

/**
 * CuratedAccordion — full-width, balanced expanding panel accordion.
 * - Desktop: spans 100% window width with padding-inline clamp(16px, 3vw, 48px).
 *   Active card flex: 3.8 1 0%, inactive cards flex: 1 1 0% with 700ms cubic-bezier transition.
 *   Responsive height: clamp(420px, 68vh, 760px).
 * - Mobile (< 768px): vertical accordion, active card ~55vh, inactive cards ~64px strips.
 * - Bottom gradient on every card for high contrast text readability over full-page background.
 */
export const CuratedAccordion: React.FC<CuratedAccordionProps> = ({
  items,
  onSelectItem,
  enableHoverExpand = true,
  showVerticalTitles = false,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const touchStartY = useRef<number>(0)
  const touchStartX = useRef<number>(0)
  const isTouchSwiping = useRef<boolean>(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }))
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActiveIndex(index)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % items.length)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
    }
  }

  const handleMouseEnter = (index: number) => {
    if (!enableHoverExpand) return
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveIndex(index)
    }, 45)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
    isTouchSwiping.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current)
    if (deltaY > 10 || deltaX > 10) {
      isTouchSwiping.current = true
    }
  }

  const handleTouchEnd = (index: number) => {
    if (!isTouchSwiping.current) {
      setActiveIndex(index)
    }
  }

  return (
    <div
      className="relative w-full pt-1 pb-4 select-none"
      style={{
        width: '100%',
        maxWidth: 'none',
        paddingLeft: 'clamp(16px, 3vw, 48px)',
        paddingRight: 'clamp(16px, 3vw, 48px)',
      }}
    >
      {/* Full-width Accordion Row */}
      <div
        role="tablist"
        aria-label="Latest Collection Showcase"
        className="relative flex flex-col md:flex-row w-full select-none h-auto md:h-[clamp(420px,68vh,760px)]"
        style={{
          gap: 'clamp(10px, 1.2vw, 20px)',
        }}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index
          const hasImageError = imageErrors[item.id]

          return (
            <div
              key={item.id}
              role="tab"
              id={`portfolio-tab-${item.id}`}
              aria-controls={`portfolio-panel-${item.id}`}
              aria-selected={isActive}
              aria-expanded={isActive}
              tabIndex={0}
              onClick={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                setActiveIndex(index)
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{
                flex: isActive ? '3.8 1 0%' : '1 1 0%',
              }}
              className={`
                accordion-card group relative overflow-hidden rounded-[20px] md:rounded-[24px] cursor-pointer
                border border-white/15 shadow-2xl bg-neutral-950/80
                accordion-transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c10]
                ${
                  isActive
                    ? 'h-[55vh] min-h-[340px] md:h-auto ring-1 ring-amber-400/40 shadow-amber-950/30'
                    : 'h-[64px] min-h-[64px] md:h-auto md:min-h-0 md:min-w-0 hover:border-white/30'
                }
              `}
            >
              {/* Background Photography Layer */}
              <div className="absolute inset-0 w-full h-full bg-neutral-950">
                {!hasImageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    loading={isActive || index === 0 ? 'eager' : 'lazy'}
                    onError={() => handleImageError(item.id)}
                    className={`
                      w-full h-full object-cover object-center pointer-events-none
                      transition-transform duration-700 ease-out
                      ${isActive ? 'scale-100' : 'scale-105 group-hover:scale-110'}
                    `}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${item.fallbackColor} flex flex-col items-center justify-center p-6 text-center`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 text-amber-200">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="font-serif italic text-xl font-bold text-white/90">{item.name}</p>
                    <p className="text-xs text-amber-200/80 mt-1 uppercase tracking-wider">{item.craft}</p>
                  </div>
                )}

                {/* Inactive card tint scrim */}
                <div
                  className={`absolute inset-0 bg-black/35 transition-opacity duration-300 pointer-events-none ${
                    isActive ? 'opacity-0' : 'opacity-100 group-hover:opacity-10'
                  }`}
                />

                {/* Soft dark bottom gradient on every card for solid text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                {/* Active enhanced bottom vignette */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity duration-500 pointer-events-none ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>

              {/* Mobile (< 768px) collapsed horizontal strip title */}
              {!isActive && (
                <div className="md:hidden absolute inset-0 flex items-center justify-between px-5 z-10 pointer-events-none bg-black/45 backdrop-blur-[2px]">
                  <span className="font-serif italic text-base font-semibold text-white/95 truncate drop-shadow-sm">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-mono">
                    <span className="text-[10px] tracking-widest uppercase opacity-75">Explore</span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  </div>
                </div>
              )}

              {/* Active panel expanded content */}
              <div
                id={`portfolio-panel-${item.id}`}
                className={`
                  absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 flex flex-col justify-end text-left z-20
                  ${
                    isActive
                      ? 'opacity-100 translate-y-0 pointer-events-auto transition-all duration-500 delay-150 ease-out'
                      : 'opacity-0 translate-y-6 pointer-events-none transition-all duration-200 delay-0 ease-in'
                  }
                `}
              >
                {/* Craft tag badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F4D389] font-mono text-[10px] uppercase tracking-widest w-fit mb-2">
                  <Sparkles className="w-3 h-3 text-[#F4D389]" />
                  <span>{item.craft}</span>
                </div>

                {/* Garment Title */}
                <h3 className="font-serif italic text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-4 drop-shadow-md">
                  {item.name}
                </h3>

                {/* View Details Action */}
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectItem?.(item)
                    }}
                    className="inline-flex items-center gap-2.5 px-6 py-2.5 sm:py-3 rounded-full bg-white hover:bg-[#F4D389] text-neutral-950 font-semibold text-xs sm:text-sm active:scale-95 transition-all duration-200 shadow-xl shadow-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D389] cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-neutral-900" />
                    <span>View details</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation hints and dot indicators */}
      <div
        className="mt-4 flex flex-wrap items-center justify-between text-xs text-neutral-400 px-2 gap-2"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Panel {activeIndex + 1} of {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {items.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setActiveIndex(dotIdx)}
              aria-label={`Go to panel ${dotIdx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === dotIdx ? 'w-6 bg-amber-400' : 'w-2 bg-neutral-700 hover:bg-neutral-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
