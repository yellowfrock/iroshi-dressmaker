'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { sequence360Config, getFrameFilename } from '@/config/sequence-360'
import type { Dress, FeaturedImage } from '@/types'
import type { PortfolioItem } from '@/data/portfolio-items'
import { getWhatsAppUrl } from '@/lib/whatsapp'
import DressCard from '@/components/dresses/DressCard'
import LatestCollection from '@/components/portfolio/LatestCollection'

interface TheSequenceHomepageProps {
  whatsappNumber?: string | null
  rentalDresses?: Dress[]
  bridalDresses?: Dress[]
  featuredImages?: FeaturedImage[]
  latestCollectionItems?: PortfolioItem[]
}

// -------------------------------------------------------------
// 7 Perspective Card Slot Presets for Hero Rotation
// -------------------------------------------------------------
const HERO_CARD_PRESETS = [
  { rotateY: 28, translateY: 20, scale: 0.9 },
  { rotateY: 20, translateY: 10, scale: 0.93 },
  { rotateY: 10, translateY: 0, scale: 0.96 },
  { rotateY: 0, translateY: -10, scale: 1.0 },
  { rotateY: -10, translateY: 0, scale: 0.96 },
  { rotateY: -20, translateY: 10, scale: 0.93 },
  { rotateY: -28, translateY: 20, scale: 0.9 },
]

// -------------------------------------------------------------
// Default Fallback Gallery Pieces (Used if database is empty)
// -------------------------------------------------------------
const DEFAULT_GALLERY_PIECES = [
  {
    id: 'gallery-card-1',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505825/iroshi-gallery-img_13.jpg.png',
    alt: 'Emerald Luxe Gown',
    rotateY: 28,
    translateY: 20,
    scale: 0.9,
  },
  {
    id: 'gallery-card-2',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505818/iroshi-gallery-img_12.jpg.jpg',
    alt: 'Golden Zari Silhouette',
    rotateY: 20,
    translateY: 10,
    scale: 0.93,
  },
  {
    id: 'gallery-card-3',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505817/iroshi-gallery-img_11.jpg.jpg',
    alt: 'Rosewater Chiffon Gown',
    rotateY: 10,
    translateY: 0,
    scale: 0.96,
  },
  {
    id: 'gallery-card-4',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505816/iroshi-gallery-img_10.jpg.jpg',
    alt: 'Midnight Shimmer Dress',
    rotateY: 0,
    translateY: -10,
    scale: 1.0,
  },
  {
    id: 'gallery-card-5',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505814/iroshi-gallery-img_9.jpg.jpg',
    alt: 'Champagne Mermaid Gown',
    rotateY: -10,
    translateY: 0,
    scale: 0.96,
  },
  {
    id: 'gallery-card-6',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505813/iroshi-gallery-img_8.jpg.jpg',
    alt: 'Crimson Velvet Reception Dress',
    rotateY: -20,
    translateY: 10,
    scale: 0.93,
  },
  {
    id: 'gallery-card-7',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505812/iroshi-gallery-img_7.jpg.jpg',
    alt: 'Royal Sapphire Evening Gown',
    rotateY: -28,
    translateY: 20,
    scale: 0.9,
  },
  {
    id: 'gallery-card-8',
    image: 'https://res.cloudinary.com/ecyvwovp/image/upload/v1788505811/iroshi-gallery-img_5.jpg.jpg',
    alt: 'Celestial Pearl Tulle Gown',
    rotateY: -35,
    translateY: 30,
    scale: 0.86,
  },
]

// -------------------------------------------------------------
// Timeline Phase Markers matching Netlify reference
// -------------------------------------------------------------
const TIMELINE_PHASES = [
  {
    frame: 1,
    title: 'Phase I',
    subtitle: 'Nucleation',
    description: 'Initial structural seed state at focal point zero. Optical symmetry is preserved before procedural shear.',
    focalPoint: '0.0000 λ',
  },
  {
    frame: 75,
    title: 'Phase II',
    subtitle: 'Caustic Divergence',
    description: 'Birefringence emerges along the major refractive axes. Light rays splinter into high-harmonic filaments.',
    focalPoint: '0.2500 λ',
  },
  {
    frame: 150,
    title: 'Phase III',
    subtitle: 'Internal Reflection',
    description: 'Volumetric expansion achieves peak refractive index. Multi-surface caustics overlap in orbital loops.',
    focalPoint: '0.5000 λ',
  },
  {
    frame: 225,
    title: 'Phase IV',
    subtitle: 'Chromatic Dispersion',
    description: 'Spectral separation across boundary layers. Angular momentum produces toroidal caustic wraps.',
    focalPoint: '0.7500 λ',
  },
  {
    frame: 300,
    title: 'Phase V',
    subtitle: 'Asymptotic Coherence',
    description: 'Resonant harmonic closure. The caustic field aligns into a coherent standing-wave envelope.',
    focalPoint: '1.0000 λ',
  },
]

// -------------------------------------------------------------
// Procedural Fallback Engine (generative couture geometry while loading)
// -------------------------------------------------------------
class ProceduralFrameRenderer {
  private cache = new Map<number, HTMLCanvasElement>()
  private baseWidth = 1280
  private baseHeight = 720

  getFrameCanvas(frame: number, total = 300): HTMLCanvasElement {
    const clamped = Math.max(1, Math.min(total, Math.round(frame)))
    if (this.cache.has(clamped)) return this.cache.get(clamped)!

    const canvas = document.createElement('canvas')
    canvas.width = this.baseWidth
    canvas.height = this.baseHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      this.renderProceduralFrame(ctx, this.baseWidth, this.baseHeight, clamped, total)
      this.cache.set(clamped, canvas)
    }
    return canvas
  }

  private renderProceduralFrame(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    frame: number,
    total: number
  ) {
    const progress = (frame - 1) / (total - 1)
    const cx = w / 2
    const cy = h / 2

    // Dark graphite ambient
    ctx.fillStyle = '#080808'
    ctx.fillRect(0, 0, w, h)

    const radGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(w, h) * 0.7)
    radGrad.addColorStop(0, 'rgba(32, 32, 36, 0.45)')
    radGrad.addColorStop(0.5, 'rgba(16, 16, 18, 0.2)')
    radGrad.addColorStop(1, 'rgba(8, 8, 8, 0.95)')
    ctx.fillStyle = radGrad
    ctx.fillRect(0, 0, w, h)

    // Subtle fine grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    const gridSize = 80
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Concentric harmonic couture rings
    const ringCount = 14
    for (let i = 0; i < ringCount; i++) {
      const t = i / ringCount
      const radius = 60 + t * 260 + Math.sin(progress * Math.PI * 2 + t * 5) * (18 + progress * 45)
      const angle = progress * 2.5 + t * 3.14

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle * 0.15)
      ctx.beginPath()
      ctx.ellipse(
        Math.cos(angle) * (15 + progress * 40),
        Math.sin(angle) * (10 + progress * 30),
        radius,
        radius * (0.65 + Math.sin(progress * 3 + t * 4) * 0.25),
        angle,
        0,
        Math.PI * 2
      )
      const alpha = (0.04 + (1 - t) * 0.14) * (0.4 + 0.6 * Math.sin(progress * Math.PI + t * 2))
      ctx.strokeStyle = `rgba(244, 211, 137, ${alpha.toFixed(3)})`
      ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.8
      ctx.stroke()
      ctx.restore()
    }

    // Central luminous petal silhouette
    ctx.save()
    ctx.translate(cx, cy)
    const petals = 6 + Math.floor(progress * 8)
    const rot = progress * Math.PI * 1.5
    ctx.rotate(rot)

    const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 180 + progress * 140)
    glow.addColorStop(0, `rgba(255, 255, 255, ${0.35 + (1 - progress) * 0.25})`)
    glow.addColorStop(0.3, `rgba(244, 211, 137, ${0.18 + progress * 0.15})`)
    glow.addColorStop(0.7, 'rgba(120, 130, 145, 0.05)')
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, 180 + progress * 140, 0, Math.PI * 2)
    ctx.fill()

    const waveCount = 9
    for (let j = 0; j < waveCount; j++) {
      const frac = j / waveCount
      ctx.beginPath()
      const segs = 160
      for (let s = 0; s <= segs; s++) {
        const theta = (s / segs) * Math.PI * 2
        const p1 = Math.sin(theta * petals + progress * 4 + frac * Math.PI)
        const p2 = Math.cos(theta * 3 - progress * 2 + j)
        const r = 90 + progress * 140 + frac * 40 + p1 * (25 + progress * 60) + p2 * (15 + frac * 25)
        const px = Math.cos(theta) * r
        const py = Math.sin(theta) * r * (0.85 + Math.sin(theta + progress) * 0.15)
        if (s === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()

      const grad = ctx.createLinearGradient(-150, -150, 150, 150)
      const op = 0.08 + (j % 2 === 0 ? 0.06 : 0.02) + (1 - frac) * 0.05
      grad.addColorStop(0, `rgba(244, 211, 137, ${op})`)
      grad.addColorStop(0.5, 'rgba(180, 190, 210, 0.02)')
      grad.addColorStop(1, `rgba(255, 255, 255, ${op * 0.7})`)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + frac * 0.22})`
      ctx.lineWidth = j === 0 || j === waveCount - 1 ? 1.8 : 0.75
      ctx.stroke()
    }
    ctx.restore()
  }
}

const proceduralEngine = new ProceduralFrameRenderer()

// -------------------------------------------------------------
// Main Sequence Homepage Component
// -------------------------------------------------------------
export default function TheSequenceHomepage({
  whatsappNumber = '94769750186',
  rentalDresses = [],
  bridalDresses = [],
  featuredImages = [],
  latestCollectionItems = [],
}: TheSequenceHomepageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesCache = useRef<Map<number, HTMLImageElement>>(new Map())

  // Dynamic Featured Looks (7 Overlapping Cards Rotation)
  const [rotatedLooks, setRotatedLooks] = useState(() => {
    if (featuredImages && featuredImages.length > 0) {
      const active = featuredImages.filter((img) => img.is_active !== false)
      if (active.length > 0) {
        const count = Math.min(active.length, 7)
        return active.slice(0, count).map((item, idx) => {
          const preset = HERO_CARD_PRESETS[idx] || HERO_CARD_PRESETS[Math.min(idx, HERO_CARD_PRESETS.length - 1)]
          return {
            id: `featured-look-${item.id || idx}`,
            image: item.image_url,
            alt: `Featured Look #${idx + 1}`,
            rotateY: preset.rotateY,
            translateY: preset.translateY,
            scale: preset.scale,
          }
        })
      }
    }
    return DEFAULT_GALLERY_PIECES
  })

  // On page load/refresh: randomly shuffle and pick 7
  useEffect(() => {
    if (!featuredImages || featuredImages.length === 0) return

    const active = featuredImages.filter((img) => img.is_active !== false)
    if (active.length === 0) return

    const shuffled = [...active].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.min(shuffled.length, 7))

    const mapped = selected.map((item, idx) => {
      const preset = HERO_CARD_PRESETS[idx] || HERO_CARD_PRESETS[Math.min(idx, HERO_CARD_PRESETS.length - 1)]
      return {
        id: `featured-look-${item.id || idx}`,
        image: item.image_url,
        alt: `Featured Look #${idx + 1}`,
        rotateY: preset.rotateY,
        translateY: preset.translateY,
        scale: preset.scale,
      }
    })

    setRotatedLooks(mapped)
  }, [featuredImages])

  // Telemetry & UI states
  const [grayscaleFilter] = useState(false)

  const targetFrame = useRef(1)
  const renderedFrame = useRef(1)
  const rafId = useRef<number | null>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const TOTAL_FRAMES = sequence360Config.FRAME_COUNT || 300

  // 1. High performance Canvas Rendering (with exact Netlify scaling & fallback)
  const drawFrame = useCallback(
    (frameNum: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      if (w === 0 || h === 0) return

      const clamped = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameNum)))

      // Find exact or closest available frame
      let img = imagesCache.current.get(clamped)
      if (!img || img.naturalWidth === 0) {
        let minDiff = Infinity
        for (const [k, v] of imagesCache.current.entries()) {
          if (v && v.naturalWidth > 0) {
            const diff = Math.abs(k - clamped)
            if (diff < minDiff) {
              minDiff = diff
              img = v
              if (diff <= 1) break
            }
          }
        }
      }

      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const imgW = img.naturalWidth
        const imgH = img.naturalHeight
        const canvasAspect = w / h
        const imgAspect = imgW / imgH

        let renderW = w
        let renderH = h
        let offsetX = 0
        let offsetY = 0

        if (canvasAspect > imgAspect) {
          renderW = w
          renderH = w / imgAspect
          offsetY = (h - renderH) / 2
        } else {
          renderH = h
          renderW = h * imgAspect
          offsetX = (w - renderW) / 2
        }

        ctx.fillStyle = '#050505'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH)
      } else {
        // Procedural Couture fallback geometry
        const proc = proceduralEngine.getFrameCanvas(clamped, TOTAL_FRAMES)
        const pW = proc.width
        const pH = proc.height
        const canvasAspect = w / h
        const pAspect = pW / pH

        let renderW = w
        let renderH = h
        let offsetX = 0
        let offsetY = 0

        if (canvasAspect > pAspect) {
          renderW = w
          renderH = w / pAspect
          offsetY = (h - renderH) / 2
        } else {
          renderH = h
          renderW = h * pAspect
          offsetX = (w - renderW) / 2
        }

        ctx.drawImage(proc, offsetX, offsetY, renderW, renderH)
      }
    },
    [TOTAL_FRAMES]
  )

  // Track whether local /360-frames/ are available (set to false after first 404 to eliminate redundant requests)
  const localFramesAvailableRef = useRef<boolean | null>(null)
  const loadingFramesRef = useRef<Set<number>>(new Set())

  // Fast single-frame loader with instant Cloudinary fallback
  const loadFrame = useCallback(
    (idx: number): Promise<HTMLImageElement | null> => {
      if (imagesCache.current.has(idx)) {
        return Promise.resolve(imagesCache.current.get(idx)!)
      }
      if (loadingFramesRef.current.has(idx)) {
        return Promise.resolve(null)
      }
      loadingFramesRef.current.add(idx)

      const cloudinaryUrl = `https://res.cloudinary.com/ecyvwovp/image/upload/v1788579722/ezgif-frame-${String(
        idx
      ).padStart(3, '0')}.jpg`

      return new Promise((resolve) => {
        // If we already know local frames are not available on this host, go straight to Cloudinary
        if (localFramesAvailableRef.current === false) {
          const cImg = new Image()
          cImg.crossOrigin = 'anonymous'
          cImg.onload = () => {
            loadingFramesRef.current.delete(idx)
            imagesCache.current.set(idx, cImg)
            if (idx === 1 || Math.round(targetFrame.current) === idx) {
              drawFrame(idx)
            }
            resolve(cImg)
          }
          cImg.onerror = () => {
            loadingFramesRef.current.delete(idx)
            resolve(null)
          }
          cImg.src = cloudinaryUrl
          return
        }

        // Try local first
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          localFramesAvailableRef.current = true
          loadingFramesRef.current.delete(idx)
          imagesCache.current.set(idx, img)
          if (idx === 1 || Math.round(targetFrame.current) === idx) {
            drawFrame(idx)
          }
          resolve(img)
        }

        img.onerror = () => {
          // Immediately mark local as unavailable so frames 2..300 NEVER waste time testing /360-frames/!
          localFramesAvailableRef.current = false

          const fallbackImg = new Image()
          fallbackImg.crossOrigin = 'anonymous'
          fallbackImg.onload = () => {
            loadingFramesRef.current.delete(idx)
            imagesCache.current.set(idx, fallbackImg)
            if (idx === 1 || Math.round(targetFrame.current) === idx) {
              drawFrame(idx)
            }
            resolve(fallbackImg)
          }
          fallbackImg.onerror = () => {
            loadingFramesRef.current.delete(idx)
            resolve(null)
          }
          fallbackImg.src = cloudinaryUrl
        }

        img.src = `/360-frames/${getFrameFilename(idx)}`
      })
    },
    [drawFrame]
  )

  // Preload frames in the immediate window around target frame
  const loadNearbyFrames = useCallback(
    (currentCenter: number) => {
      const center = Math.round(currentCenter)
      const targets = [center - 2, center - 1, center, center + 1, center + 2]
      for (const t of targets) {
        if (t >= 1 && t <= TOTAL_FRAMES && !imagesCache.current.has(t)) {
          loadFrame(t)
        }
      }
    },
    [TOTAL_FRAMES, loadFrame]
  )

  // 2. High Performance Progressive Preloader
  useEffect(() => {
    let isCancelled = false

    async function initializePreloader() {
      // Step A: Immediate first frame — load and draw right away for zero LCP delay
      await loadFrame(1)
      if (isCancelled) return
      drawFrame(1)

      // Step B: Load 12 sparse keyframes across the 300-frame sequence
      // With keyframes + closest-frame interpolation, 360 rotation is already functional!
      const keyframes = [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300]
      for (const k of keyframes) {
        if (isCancelled) return
        await loadFrame(k)
      }

      // Step C: Delay loading remaining non-essential frames until main page elements settle
      await new Promise((r) => setTimeout(r, 2000))
      if (isCancelled) return

      // Step D: Lazily fill in remaining frames in gentle background batches
      const remaining: number[] = []
      for (let i = 2; i <= TOTAL_FRAMES; i++) {
        if (!imagesCache.current.has(i)) remaining.push(i)
      }

      const batchSize = 6
      for (let i = 0; i < remaining.length && !isCancelled; i += batchSize) {
        const chunk = remaining.slice(i, i + batchSize)
        await Promise.all(chunk.map((idx) => loadFrame(idx)))
        // 120ms pause between batches prevents browser network/thread congestion
        await new Promise((r) => setTimeout(r, 120))
      }
    }

    initializePreloader()

    return () => {
      isCancelled = true
    }
  }, [TOTAL_FRAMES, loadFrame, drawFrame])

  // 3. Animation loop with smooth dampening (0.3 lerp factor)
  useEffect(() => {
    let running = true

    const loop = () => {
      if (!running) return
      const current = renderedFrame.current
      const target = targetFrame.current
      const delta = target - current

      if (Math.abs(delta) > 0.05) {
        renderedFrame.current += delta * 0.3
        drawFrame(renderedFrame.current)
      } else if (Math.abs(delta) > 0.001) {
        renderedFrame.current = target
        drawFrame(target)
      }

      rafId.current = requestAnimationFrame(loop)
    }

    rafId.current = requestAnimationFrame(loop)

    return () => {
      running = false
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [drawFrame])

  // 4. ResizeObserver for pixel-perfect devicePixelRatio scaling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateSize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      drawFrame(renderedFrame.current)
    }

    const observer = new ResizeObserver(() => updateSize())
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    updateSize()

    return () => observer.disconnect()
  }, [drawFrame])

  // 5. Scroll Progress directly drives 360 rotation in the background (rAF throttled)
  useEffect(() => {
    let scrollRafId: number | null = null

    const onScroll = () => {
      // Check prefers-reduced-motion
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      if (scrollRafId !== null) return
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const scrollY = window.scrollY
        const progress = Math.max(0, Math.min(1, scrollY / maxScroll))
        const frame = Math.round(1 + progress * (TOTAL_FRAMES - 1))

        targetFrame.current = frame
        loadNearbyFrames(frame)
      })

      isScrollingRef.current = true
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false
      }, 150)
    }

    // Keyboard accessibility for scrubbing frames
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        targetFrame.current = Math.min(TOTAL_FRAMES, targetFrame.current + 4)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        targetFrame.current = Math.max(1, targetFrame.current - 4)
      } else if (e.key === 'Home') {
        e.preventDefault()
        targetFrame.current = 1
      } else if (e.key === 'End') {
        e.preventDefault()
        targetFrame.current = TOTAL_FRAMES
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKeyDown)
      if (scrollRafId !== null) cancelAnimationFrame(scrollRafId)
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)
    }
  }, [TOTAL_FRAMES, loadNearbyFrames])

  // 6. Mouse movement scrubbing across hero section
  const handleHeroMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isScrollingRef.current) return
      const rect = e.currentTarget.getBoundingClientRect()
      if (rect.width <= 0) return
      const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const frame = Math.round(1 + progress * (TOTAL_FRAMES - 1))
      targetFrame.current = frame
      loadNearbyFrames(frame)
    },
    [TOTAL_FRAMES, loadNearbyFrames]
  )

  // 7. Touch swipe scrubbing
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (e.touches.length !== 1 || !touchStartRef.current) return
      const clientX = e.touches[0].clientX
      const clientY = e.touches[0].clientY
      const dx = clientX - touchStartRef.current.x
      const dy = clientY - touchStartRef.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        const delta = dx * 0.75 - dy * 0.4
        const next = Math.max(1, Math.min(TOTAL_FRAMES, targetFrame.current + delta))
        targetFrame.current = next
        loadNearbyFrames(next)
        touchStartRef.current = { x: clientX, y: clientY }
      }
    },
    [TOTAL_FRAMES, loadNearbyFrames]
  )

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  // Direct manual jump or scrub
  const handleJumpToFrame = (frame: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_FRAMES, frame))
    targetFrame.current = clamped
  }

  const handleSelectTab = (tab: 'home' | 'timeline' | 'metadata') => {
    if (tab === 'timeline') {
      const whoSec = document.getElementById('who-we-are-section')
      if (whoSec) whoSec.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToRentalCollection = () => {
    const el = document.getElementById('rental-collection-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
  }
  const effectiveWhatsAppNumber = whatsappNumber || '94769750186'
  const waUrl = getWhatsAppUrl(effectiveWhatsAppNumber) || `https://wa.me/${effectiveWhatsAppNumber}`

  return (
    <div
      ref={containerRef}
      id="monograph-scroll-container"
      className="relative w-full max-w-full min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white overflow-x-hidden"
    >
      {/* ============================================================
          FIXED FULLSCREEN 360 ROTATION BACKGROUND LAYER
         ============================================================ */}
      <div id="page-background-layer" className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Ambient Dark Radial Gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a20 0%, #050505 100%)' }}
        />

        {/* Subtle Tech Dot Grid */}
        <div className="dot-grid" />

        {/* Mobile Hero Image (max-width: 768px) */}
        <picture id="hero-mobile-picture">
          <source media="(max-width: 768px)" srcSet="/images/hero-mobile.png" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788579722/ezgif-frame-001.jpg"
            alt="Iroshi Dressmaker"
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            loading="eager"
          />
        </picture>

        {/* 360 Canvas Renderer */}
        <canvas
          ref={canvasRef}
          id="heroCanvas"
          className={`w-full h-full object-cover transition-[filter] duration-300 ${
            grayscaleFilter ? 'opacity-70 grayscale brightness-75' : 'opacity-85 brightness-95 contrast-[1.02]'
          }`}
        />
      </div>

      {/* ============================================================
          HERO SECTION (OVERLAYING 360 BACKGROUND)
         ============================================================ */}
      <section
        id="hero-section"
        onMouseMove={handleHeroMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 min-h-screen w-full max-w-full text-[#e5e5e5] overflow-x-hidden flex flex-col justify-between select-none bg-transparent"
      >

        {/* Main Monograph Hero Content */}
        <div
          id="monograph-hero-main"
          className="relative z-10 flex-1 flex items-center px-4 sm:px-8 lg:px-[60px] py-4 sm:py-6 lg:py-8 w-full max-w-full pointer-events-none"
        >
          {/* Left Narrative Heading */}
          <div className="hero-content max-w-[800px] w-full pointer-events-auto">
            <h1
              id="hero-heading"
              className="text-[clamp(1.7rem,5vw,4.2rem)] font-light leading-[1.18] sm:leading-[1.12] tracking-[-0.02em] mb-4 sm:mb-8 text-[#f0f4ff] drop-shadow-[0_0_30px_rgba(255,255,255,0.05)] select-none"
            >
              Discover the artistry,{' '}
              <span className="font-serif italic">craftmanship &amp; Unique Designs</span> behind{' '}
              <span className="font-serif italic font-bold text-[1.15em] sm:text-[1.28em] text-[#F4D389] drop-shadow-[0_0_20px_rgba(244,211,137,0.35)] block sm:inline mt-1.5 sm:mt-0">
                Iroshi Dressmaker
              </span>
            </h1>

            <div className="description-wrap flex items-start gap-4 sm:gap-8 lg:gap-10">
              <div className="line-accent w-8 sm:w-16 h-[1px] bg-[#e5e5e5]/20 mt-3 shrink-0" />
              <div className="flex-1">
                <p
                  id="hero-narrative-summary"
                  className="description text-[0.88rem] sm:text-[1rem] leading-[1.65] sm:leading-[1.7] max-w-[360px] text-[#e5e5e5]/80 font-light"
                >
                  From the first idea to the final fitting, explore the dresses.
                </p>
                <div id="cta-btn-container" className="flex flex-wrap items-center gap-3 mt-6 sm:mt-10">
                  <a
                    id="cta-browse-our-work-btn"
                    href="https://www.behance.net/indirairoshini"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-button inline-flex items-center justify-center text-center no-underline cursor-pointer min-h-[44px]"
                  >
                    <span>Browse Our Work</span>
                  </a>
                  <Link
                    id="cta-our-portfolio-btn"
                    href="/portfolio"
                    className="cta-button-portfolio inline-flex items-center justify-center text-center no-underline cursor-pointer min-h-[44px]"
                  >
                    <span>OUR PORTFOLIO</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monograph Footer */}
        <footer
          id="monograph-footer"
          className="relative z-20 px-4 sm:px-8 lg:px-[60px] py-4 sm:py-6 lg:py-[36px] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 border-t border-[#e5e5e5]/10 w-full max-w-full select-none"
        >
          <div
            id="footer-project-meta"
            className="project-meta flex flex-wrap items-center gap-3 sm:gap-8 lg:gap-14"
          >
            <div id="footer-meta-lk" className="meta-block flex flex-col">
              <a
                href="https://www.iroshidressmaker.lk"
                target="_blank"
                rel="noopener noreferrer"
                className="value text-[0.78rem] sm:text-[0.9rem] font-normal text-[#e5e5e5]/80 hover:text-white transition-colors py-1"
              >
                www.iroshidressmaker.lk
              </a>
            </div>
            <div className="meta-block flex flex-col">
              <a
                href="https://www.iroshidressmaker.com"
                target="_blank"
                rel="noopener noreferrer"
                className="value text-[0.78rem] sm:text-[0.9rem] font-normal text-[#e5e5e5]/80 hover:text-white transition-colors py-1"
              >
                www.iroshidressmaker.com
              </a>
            </div>
            <div className="meta-block flex flex-col">
              <a
                href="tel:+94769750186"
                className="value text-[0.78rem] sm:text-[0.9rem] font-mono tracking-wider text-[#e5e5e5]/80 hover:text-white transition-colors py-1"
              >
                +94 76 975 0186
              </a>
            </div>
          </div>
        </footer>
      </section>

      {/* ============================================================
          LATEST COLLECTION SECTION (IMAGE CARDS ACCORDION)
         ============================================================ */}
      <LatestCollection
        variant="home"
        items={latestCollectionItems}
      />

      {/* ============================================================
          RENTAL COLLECTION SECTION (3D PERSPECTIVE CAROUSEL)
         ============================================================ */}
      <section
        id="rental-collection-section"
        className="relative z-10 w-full max-w-full bg-transparent py-14 sm:py-24 lg:py-36 px-3 sm:px-6 lg:px-8 overflow-hidden select-none"
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div
            id="creators-badge"
            className="inline-flex items-center justify-center px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full bg-[#F4D389] text-[#18181b] text-xs sm:text-sm font-semibold tracking-tight shadow-sm mb-4 sm:mb-7 hover:brightness-105 transition-all"
          >
            Let’s Love Fashion
          </div>

          <h2
            id="rental-collection-heading"
            className="text-3xl sm:text-5xl md:text-6xl lg:text-[5rem] font-extrabold tracking-[-0.03em] text-white leading-[1.12] sm:leading-[1.08] max-w-4xl mx-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] px-2"
          >
            Elegance to Rent,
            <br />
            Memories to Keep.
          </h2>

          <p
            id="rental-collection-subheading"
            className="mt-3.5 sm:mt-6 text-sm sm:text-base md:text-lg text-white/80 font-normal leading-relaxed max-w-2xl mx-auto px-4"
          >
            Discover beautiful dresses for your special moments,
            <br className="hidden sm:inline" /> available to rent and ready to make you feel unforgettable.
          </p>

          <div className="flex sm:hidden items-center gap-1.5 mt-5 text-white/40 font-mono text-[0.68rem] tracking-wider uppercase">
            <span>←</span>
            <span>Swipe to explore gallery</span>
            <span>→</span>
          </div>
        </div>

        {/* 3D Perspective Cards Track */}
        <div
          id="rental-cards-viewport"
          className="w-full max-w-full mt-6 sm:mt-14 lg:mt-18 overflow-x-auto no-scrollbar py-4 sm:py-8 perspective-1200 touch-pan-x"
        >
          <div
            id="rental-cards-track"
            className="flex items-center justify-start xl:justify-center gap-3 sm:gap-4 md:gap-5 px-4 sm:px-8 lg:px-12 w-max mx-auto snap-x snap-mandatory"
          >
            {rotatedLooks.map((piece) => (
              <div
                key={piece.id}
                id={piece.id}
                className="group relative w-[145px] sm:w-[200px] md:w-[230px] lg:w-[250px] aspect-[9/13.5] sm:aspect-[9/14] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shrink-0 snap-center transition-all duration-500 ease-out cursor-pointer hover:!rotate-y-0 hover:!scale-105 hover:z-20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                style={{
                  transform: `perspective(1200px) rotateY(${piece.rotateY}deg) translateY(${piece.translateY}px) scale(${piece.scale})`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={piece.image}
                  alt={piece.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 brightness-[0.92] group-hover:brightness-100"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                  <span className="text-xs font-mono text-[#F4D389] tracking-wider uppercase">
                    {piece.alt}
                  </span>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-white underline mt-1"
                  >
                    Rent Dress →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explore Rental Collection Action */}
        <div className="flex justify-center mt-8 sm:mt-14 px-4 gap-4">
          <Link
            id="cta-explore-rental-collection"
            href="/rental"
            className="w-full max-w-[300px] sm:max-w-none sm:w-auto inline-flex items-center justify-center min-h-[48px] px-6 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-medium text-sm sm:text-base md:text-lg tracking-normal transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] shadow-[0_8px_30px_rgba(216,27,43,0.4)] hover:shadow-[0_12px_40px_rgba(216,27,43,0.6)] cursor-pointer no-underline text-center"
          >
            Explore Rental Collection
          </Link>
        </div>
      </section>

      {/* ============================================================
          WHO WE ARE (STUDIO, LOCATIONS, SEALS & TEAM)
         ============================================================ */}
      <section
        id="who-we-are-section"
        className="relative z-10 w-full max-w-full bg-[#050505] text-[#e5e5e5] pt-12 pb-28 sm:pt-20 sm:pb-20 lg:pt-28 lg:pb-28 px-4 sm:px-8 lg:px-12 select-none border-t border-white/5 overflow-hidden"
      >
        <div className="max-w-[1200px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 sm:gap-4 mb-8 sm:mb-14">
            <h2
              id="who-we-are-heading"
              className="font-serif italic font-normal text-[clamp(2.1rem,7vw,5.5rem)] leading-[0.95] text-white tracking-[-0.03em] m-0"
            >
              Who <span className="text-[#F4D389]">We</span> Are
            </h2>

            <a
              id="who-we-are-social-handle"
              href="https://www.instagram.com/iroshi_dressmaker_/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs sm:text-sm tracking-wider opacity-60 hover:opacity-100 transition-opacity text-[#e5e5e5] no-underline flex items-center gap-1.5 mt-1 sm:mt-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4D389]" />
              @iroshi_dressmaker
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 sm:gap-10 lg:gap-12 items-start mb-10 sm:mb-18">
            <div className="flex flex-col w-full">
              <p
                id="who-we-are-description"
                className="text-[0.95rem] sm:text-[1.12rem] lg:text-[1.25rem] leading-[1.68] sm:leading-[1.75] text-[#e5e5e5] max-w-[680px] font-normal m-0"
              >
                <span className="text-[#F4D389] font-semibold">Iroshi Dressmaker</span> is a
                dressmaking and rental boutique dedicated to creating beautiful dresses for every special
                occasion. We bring together creativity, careful craftsmanship, and a passion for elegant{' '}
                <span className="text-[#ff4d4d] font-semibold">fashion</span> to help every customer find a
                dress they love.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-6 mt-6 sm:mt-8 pt-1 w-full">
                {/* Colombo Location */}
                <a
                  id="location-link-colombo"
                  href="https://maps.app.goo.gl/A8KtCSsV7azDaXVc6"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Iroshi Dressmaker - Colombo on Google Maps"
                  aria-label="Colombo Location on Google Maps"
                  className="group flex items-center gap-3 no-underline cursor-pointer min-h-[44px]"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 group-hover:border-white text-white/80 group-hover:text-white bg-transparent flex items-center justify-center transition-colors duration-200 shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-medium tracking-wide text-white group-hover:text-[#F4D389] transition-colors">
                      Colombo
                    </span>
                    <span className="font-mono text-[0.65rem] tracking-wider text-white/45 group-hover:text-white/70 transition-colors uppercase">
                      Google Maps ↗
                    </span>
                  </div>
                </a>

                {/* Kurunegala Location */}
                <a
                  id="location-link-kurunegala"
                  href="https://maps.app.goo.gl/MNAjgBJd5NPSr3cs7"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Iroshi Dressmaker - Kurunegala on Google Maps"
                  aria-label="Kurunegala Location on Google Maps"
                  className="group flex items-center gap-3 no-underline cursor-pointer min-h-[44px]"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 group-hover:border-white text-white/80 group-hover:text-white bg-transparent flex items-center justify-center transition-colors duration-200 shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-medium tracking-wide text-white group-hover:text-[#F4D389] transition-colors">
                      Kurunegala
                    </span>
                    <span className="font-mono text-[0.65rem] tracking-wider text-white/45 group-hover:text-white/70 transition-colors uppercase">
                      Google Maps ↗
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex flex-row md:flex-col gap-3 sm:gap-4 mt-2 md:mt-0">
              <a
                id="social-btn-ig"
                href="https://www.instagram.com/iroshi_dressmaker_/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram - @iroshi_dressmaker_"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white bg-transparent flex items-center justify-center transition-colors duration-200 no-underline cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              <a
                id="social-btn-tt"
                href="https://www.tiktok.com/@iroshi_ilankoon?_r=1&_t=ZS-99SIdWhF9Sn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok - @iroshi_ilankoon"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white bg-transparent flex items-center justify-center transition-colors duration-200 no-underline cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>

              <a
                id="social-btn-fb"
                href="https://www.facebook.com/share/1Gw4ZexuX2/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white bg-transparent flex items-center justify-center transition-colors duration-200 no-underline cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Logo Seal & Team Atelier Image */}
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10 pt-8 sm:pt-10 border-t border-white/10 w-full max-w-[1195px] h-auto md:h-[456px]">
            <div
              id="who-we-are-logo-seal"
              className="w-[110px] sm:w-[140px] md:w-[150px] h-[110px] sm:h-[140px] md:h-[150px] rounded-full shrink-0 flex items-center justify-center relative group overflow-hidden mx-auto md:mx-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788536047/logo.png"
                alt="Iroshi Dressmaker"
                className="w-full h-full object-contain rounded-full transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div
              id="who-we-are-team-photo"
              className="w-full flex-grow h-[220px] sm:h-[300px] md:h-[435px] bg-[#111] rounded-xl sm:rounded-[20px] overflow-hidden border border-white/10 relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788517302/DSC06397.jpg"
                alt="Iroshi Dressmaker Studio & Team"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 brightness-[0.92] group-hover:brightness-100"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
