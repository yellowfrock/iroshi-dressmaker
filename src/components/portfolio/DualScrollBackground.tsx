'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface DualScrollBackgroundProps {
  imageUrlClassic: string
  imageUrlCustom: string
  isCustom: boolean
  heightScale?: number
  lerpFactor?: number
  overlayOpacity?: number
  onProgressChange?: (progress: number, translateY: number) => void
  classicPosition?: { x: number; y: number }
  customPosition?: { x: number; y: number }
  className?: string
}

/**
 * DualScrollBackground — full-page fixed-position dual-layer background:
 * - Rendered via React portal to document.body (escapes any transform/filter/overflow parent blocks)
 * - position: fixed; inset: 0; width: 100vw; height: 100lvh; z-index: 0; pointer-events: none;
 * - Crossfade between Classic & Custom image layers
 * - Scroll-driven vertical pan across the full document height with smooth lerp
 * - Dark overlay (35-50% black + gradient) ensuring all section text remains readable
 * - Automatically removed on unmount when navigating away from /portfolio
 * - Mobile safe using 100lvh / 100dvh to eliminate address bar jumps
 */
export const DualScrollBackground: React.FC<DualScrollBackgroundProps> = ({
  imageUrlClassic,
  imageUrlCustom,
  isCustom,
  heightScale = 1.6,
  lerpFactor = 0.08,
  overlayOpacity = 0.45,
  onProgressChange,
  classicPosition = { x: 50, y: 0 },
  customPosition = { x: 50, y: 0 },
  className = '',
}) => {
  const [mounted, setMounted] = useState<boolean>(false)
  const [classicLoaded, setClassicLoaded] = useState<boolean>(false)
  const [customLoaded, setCustomLoaded] = useState<boolean>(false)

  const classicImgRef = useRef<HTMLImageElement>(null)
  const customImgRef = useRef<HTMLImageElement>(null)

  const targetYRef = useRef<number>(0)
  const currentYRef = useRef<number>(0)
  const isRunningRef = useRef<boolean>(false)
  const rafIdRef = useRef<number | null>(null)
  const maxTravelRef = useRef<number>(0)
  const prefersReducedMotionRef = useRef<boolean>(false)
  const maxScrollRef = useRef<number>(1)
  const lastReportedPctRef = useRef<number>(-1)

  // Mount check for safe portal execution and hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Preload images
  useEffect(() => {
    const img1 = new Image()
    img1.src = imageUrlClassic
    img1.onload = () => setClassicLoaded(true)

    const img2 = new Image()
    img2.src = imageUrlCustom
    img2.onload = () => setCustomLoaded(true)
  }, [imageUrlClassic, imageUrlCustom])

  // Reduced motion preference listener
  useEffect(() => {
    if (typeof window === 'undefined') return
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotionRef.current = motionQuery.matches

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches
      if (e.matches) {
        if (classicImgRef.current) classicImgRef.current.style.transform = 'translate3d(0, 0, 0)'
        if (customImgRef.current) customImgRef.current.style.transform = 'translate3d(0, 0, 0)'
      }
    }

    motionQuery.addEventListener('change', handleMotionChange)
    return () => motionQuery.removeEventListener('change', handleMotionChange)
  }, [])

  // Smooth rAF lerp loop
  const startAnimation = useCallback(() => {
    if (isRunningRef.current || prefersReducedMotionRef.current) return
    isRunningRef.current = true

    const tick = () => {
      const target = targetYRef.current
      const current = currentYRef.current
      const nextY = current + (target - current) * lerpFactor
      currentYRef.current = nextY

      const transformValue = `translate3d(0, -${nextY.toFixed(2)}px, 0)`
      if (classicImgRef.current) classicImgRef.current.style.transform = transformValue
      if (customImgRef.current) customImgRef.current.style.transform = transformValue

      if (onProgressChange && maxTravelRef.current > 0) {
        const progress = Math.min(1, Math.max(0, nextY / maxTravelRef.current))
        const roundedPct = Math.round(progress * 100)
        if (roundedPct !== lastReportedPctRef.current) {
          lastReportedPctRef.current = roundedPct
          onProgressChange(progress, nextY)
        }
      }

      if (Math.abs(target - nextY) < 0.05) {
        currentYRef.current = target
        const finalTransform = `translate3d(0, -${target.toFixed(2)}px, 0)`
        if (classicImgRef.current) classicImgRef.current.style.transform = finalTransform
        if (customImgRef.current) customImgRef.current.style.transform = finalTransform
        isRunningRef.current = false
        rafIdRef.current = null
        return
      }

      rafIdRef.current = requestAnimationFrame(tick)
    }

    rafIdRef.current = requestAnimationFrame(tick)
  }, [lerpFactor, onProgressChange])

  // Update travel metrics based on viewport dimensions
  const updateMetrics = useCallback(() => {
    if (typeof window === 'undefined') return
    const viewportHeight = window.innerHeight
    const imageHeight = viewportHeight * heightScale
    const maxTravel = Math.max(0, imageHeight - viewportHeight)
    maxTravelRef.current = maxTravel

    if (prefersReducedMotionRef.current) {
      if (classicImgRef.current) classicImgRef.current.style.transform = 'translate3d(0, 0, 0)'
      if (customImgRef.current) customImgRef.current.style.transform = 'translate3d(0, 0, 0)'
      return
    }

    // Recalculate document bounds on resize/orientationchange
    const docHeight = Math.max(
      document.body?.scrollHeight || 0,
      document.documentElement?.scrollHeight || 0,
      document.body?.offsetHeight || 0,
      document.documentElement?.offsetHeight || 0,
      document.body?.clientHeight || 0,
      document.documentElement?.clientHeight || 0
    )
    const maxScroll = Math.max(1, docHeight - viewportHeight)
    maxScrollRef.current = maxScroll

    const currentScrollY = Math.max(0, window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0)
    const scrollProgress = Math.min(1, Math.max(0, currentScrollY / maxScroll))

    targetYRef.current = scrollProgress * maxTravelRef.current
    startAnimation()
  }, [heightScale, startAnimation])

  // Full-page scroll and viewport resize listeners
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    let scrollRafId: number | null = null

    const handleScroll = () => {
      if (scrollRafId !== null) return
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null
        const currentScrollY = Math.max(0, window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0)
        const maxScroll = maxScrollRef.current > 1 ? maxScrollRef.current : Math.max(1, (document.documentElement?.scrollHeight || 0) - window.innerHeight)
        const scrollProgress = Math.min(1, Math.max(0, currentScrollY / maxScroll))

        targetYRef.current = scrollProgress * maxTravelRef.current
        startAnimation()
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateMetrics, { passive: true })
    window.addEventListener('orientationchange', updateMetrics, { passive: true })

    updateMetrics()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateMetrics)
      window.removeEventListener('orientationchange', updateMetrics)
      if (scrollRafId !== null) cancelAnimationFrame(scrollRafId)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [mounted, updateMetrics, startAnimation])

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  const backgroundLayer = (
    <div
      aria-hidden="true"
      id="portfolio-fullpage-background"
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100lvh',
        minHeight: '100dvh',
        zIndex: 0,
        pointerEvents: 'none',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
      }}
    >
      {/* Classic background image layer */}
      <img
        ref={classicImgRef}
        src={imageUrlClassic}
        alt=""
        referrerPolicy="no-referrer"
        decoding="async"
        loading="eager"
        fetchPriority="high"
        onLoad={() => {
          setClassicLoaded(true)
          updateMetrics()
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${heightScale * 100}%`,
          maxHeight: 'none',
          maxWidth: 'none',
          objectFit: 'cover',
          objectPosition: `${classicPosition.x}% ${classicPosition.y}%`,
          willChange: 'transform, opacity',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
        className={`transition-opacity duration-700 ease-in-out ${
          classicLoaded ? (isCustom ? 'opacity-0' : 'opacity-100') : 'opacity-0'
        }`}
      />

      {/* Custom background image layer */}
      <img
        ref={customImgRef}
        src={imageUrlCustom}
        alt=""
        referrerPolicy="no-referrer"
        decoding="async"
        loading="eager"
        fetchPriority="high"
        onLoad={() => {
          setCustomLoaded(true)
          updateMetrics()
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${heightScale * 100}%`,
          maxHeight: 'none',
          maxWidth: 'none',
          objectFit: 'cover',
          objectPosition: `${customPosition.x}% ${customPosition.y}%`,
          willChange: 'transform, opacity',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
        className={`transition-opacity duration-700 ease-in-out ${
          customLoaded ? (isCustom ? 'opacity-100' : 'opacity-0') : 'opacity-0'
        }`}
      />

      {/* Dark overlay: 35-50% black for high contrast readability across all sections */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
        style={{ backgroundColor: `rgba(5, 5, 5, ${overlayOpacity})` }}
      />

      {/* Full-page subtle gradient vignette */}
      <div className="absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/75" />
    </div>
  )

  return createPortal(backgroundLayer, document.body)
}
