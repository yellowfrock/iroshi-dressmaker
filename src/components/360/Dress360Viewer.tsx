'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { sequence360Config, getFrameFilename } from '@/config/sequence-360'
import { useScrollFrameAnimation } from './useScrollFrameAnimation'
import WhatsAppInquiryButton from '@/components/whatsapp/WhatsAppInquiryButton'

interface Dress360ViewerProps {
  storageBaseUrl?: string
  whatsappNumber?: string | null
  dressCode?: string
  dressName?: string
}

export default function Dress360Viewer({
  storageBaseUrl = '/360-frames',
  whatsappNumber,
  dressCode = 'BR001',
  dressName = 'Signature Bridal 360 Gown',
}: Dress360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Image cache: Map frameIndex (1-300) -> HTMLImageElement
  const imagesCache = useRef<Map<number, HTMLImageElement>>(new Map())
  const [loadPercent, setLoadPercent] = useState(0)
  const [hasLoadedFirstFrame, setHasLoadedFirstFrame] = useState(false)
  const [useFallbackVisuals, setUseFallbackVisuals] = useState(false)

  // Drag interaction state
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartFrame = useRef(1)

  const { currentFrame, progress, setFrameManual } = useScrollFrameAnimation({
    containerRef,
    totalFrames: sequence360Config.FRAME_COUNT,
  })

  // Preload a single frame
  const loadFrameImage = useCallback(
    (index: number): Promise<HTMLImageElement> => {
      if (imagesCache.current.has(index)) {
        return Promise.resolve(imagesCache.current.get(index)!)
      }

      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        const filename = getFrameFilename(index)
        img.src = `${storageBaseUrl}/${filename}`

        img.onload = () => {
          imagesCache.current.set(index, img)
          resolve(img)
        }
        img.onerror = () => {
          reject(new Error(`Failed to load frame ${index}`))
        }
      })
    },
    [storageBaseUrl]
  )

  // Progressive loader strategy
  useEffect(() => {
    let isCancelled = false

    async function initializeFrames() {
      try {
        // Step 1: Load first frame immediately
        await loadFrameImage(1)
        if (!isCancelled) {
          setHasLoadedFirstFrame(true)
          setLoadPercent(10)
        }

        // Step 2: Sample every 10th frame for quick 360 overview
        const keyFrames = []
        for (let i = 10; i <= sequence360Config.FRAME_COUNT; i += 10) {
          keyFrames.push(i)
        }

        let loadedCount = 1
        for (const frame of keyFrames) {
          if (isCancelled) return
          try {
            await loadFrameImage(frame)
            loadedCount++
            setLoadPercent(Math.min(60, Math.round((loadedCount / keyFrames.length) * 50) + 10))
          } catch {
            // Ignore missing frames in progressive load
          }
        }

        // Step 3: Progressively load remaining frames
        for (let i = 2; i <= sequence360Config.FRAME_COUNT; i++) {
          if (isCancelled) return
          if (!imagesCache.current.has(i)) {
            try {
              await loadFrameImage(i)
            } catch {
              // Ignore
            }
          }
        }

        if (!isCancelled) {
          setLoadPercent(100)
        }
      } catch {
        // If storage bucket frames aren't uploaded yet, activate graceful visual simulation
        if (!isCancelled) {
          setUseFallbackVisuals(true)
          setHasLoadedFirstFrame(true)
          setLoadPercent(100)
        }
      }
    }

    initializeFrames()

    return () => {
      isCancelled = true
    }
  }, [loadFrameImage])

  // Render current frame to canvas
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Check if we have the current frame or nearest cached frame
    let imgToDraw = imagesCache.current.get(currentFrame)
    if (!imgToDraw && !useFallbackVisuals) {
      // Find closest cached frame for instant responsiveness
      let closestFrame = 1
      let minDiff = Infinity
      for (const key of imagesCache.current.keys()) {
        const diff = Math.abs(key - currentFrame)
        if (diff < minDiff) {
          minDiff = diff
          closestFrame = key
        }
      }
      imgToDraw = imagesCache.current.get(closestFrame)
    }

    if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
      // Draw image centered and scaled maintaining aspect ratio
      const imgAspect = imgToDraw.naturalWidth / imgToDraw.naturalHeight
      const canvasAspect = width / height
      let renderW = width
      let renderH = height
      let offsetX = 0
      let offsetY = 0

      if (canvasAspect > imgAspect) {
        renderW = height * imgAspect
        offsetX = (width - renderW) / 2
      } else {
        renderH = width / imgAspect
        offsetY = (height - renderH) / 2
      }

      ctx.drawImage(imgToDraw, offsetX, offsetY, renderW, renderH)
    } else {
      // Fallback Luxury 360 Visual Experience when physical 300 files are awaiting upload
      const angle = ((currentFrame - 1) / sequence360Config.FRAME_COUNT) * 2 * Math.PI
      const centerX = width / 2
      const centerY = height / 2

      // Draw subtle circular rotation grid
      ctx.save()
      ctx.strokeStyle = 'rgba(201, 169, 110, 0.25)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.ellipse(centerX, centerY + 160, 180, 50, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Draw rotation position indicator dot on ellipse
      const dotX = centerX + 180 * Math.cos(angle)
      const dotY = centerY + 160 + 50 * Math.sin(angle)
      ctx.fillStyle = '#C9A96E'
      ctx.beginPath()
      ctx.arc(dotX, dotY, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Draw stylized gown silhouette with dynamic 3D lighting gradient based on angle
      const gradient = ctx.createLinearGradient(
        centerX - 100 * Math.cos(angle),
        centerY - 100,
        centerX + 100 * Math.cos(angle),
        centerY + 100
      )
      gradient.addColorStop(0, '#FFFFFF')
      gradient.addColorStop(0.5, '#F5EDE0')
      gradient.addColorStop(1, '#D9C8AE')

      ctx.save()
      ctx.fillStyle = gradient
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 25
      ctx.shadowOffsetY = 15

      // Bodice & dress shape
      ctx.beginPath()
      ctx.moveTo(centerX - 35, centerY - 150)
      ctx.quadraticCurveTo(centerX, centerY - 165, centerX + 35, centerY - 150)
      ctx.lineTo(centerX + 25, centerY - 60)
      ctx.quadraticCurveTo(centerX + 140, centerY + 140, centerX + 110, centerY + 160)
      ctx.quadraticCurveTo(centerX, centerY + 175, centerX - 110, centerY + 160)
      ctx.quadraticCurveTo(centerX - 140, centerY + 140, centerX - 25, centerY - 60)
      ctx.closePath()
      ctx.fill()

      // Lace pattern accents
      ctx.strokeStyle = 'rgba(201, 169, 110, 0.4)'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.arc(centerX + Math.sin(angle + i) * 20, centerY - 100 + i * 40, 15 + i * 8, 0, Math.PI)
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [currentFrame, useFallbackVisuals])

  // Redraw whenever currentFrame updates
  useEffect(() => {
    drawFrame()
  }, [drawFrame])

  // Handle Drag / Touch interactions to manually spin the dress
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartFrame.current = currentFrame
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const deltaX = e.clientX - dragStartX.current
    const sensitivity = 0.5 // pixels per frame
    const frameOffset = Math.round(deltaX * sensitivity)
    let newFrame = (dragStartFrame.current + frameOffset) % sequence360Config.FRAME_COUNT
    if (newFrame <= 0) newFrame += sequence360Config.FRAME_COUNT
    setFrameManual(newFrame)
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true
      dragStartX.current = e.touches[0].clientX
      dragStartFrame.current = currentFrame
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return
    const deltaX = e.touches[0].clientX - dragStartX.current
    const sensitivity = 0.6
    const frameOffset = Math.round(deltaX * sensitivity)
    let newFrame = (dragStartFrame.current + frameOffset) % sequence360Config.FRAME_COUNT
    if (newFrame <= 0) newFrame += sequence360Config.FRAME_COUNT
    setFrameManual(newFrame)
  }

  const handleTouchEnd = () => {
    isDragging.current = false
  }

  const rotationAngle = Math.round(((currentFrame - 1) / sequence360Config.FRAME_COUNT) * 360)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: `${sequence360Config.SCROLL_HEIGHT_MULTIPLIER * 100}vh`,
        backgroundColor: 'var(--section-360-bg)',
      }}
    >
      {/* Sticky Inner Viewport */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial ambient background glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(201, 169, 110, 0.18) 0%, rgba(13, 13, 13, 0.95) 75%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Header Badge & Angle Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '32px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(201, 169, 110, 0.3)',
              backdropFilter: 'blur(8px)',
              color: 'var(--color-accent)',
              fontSize: 'var(--font-size-xs)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            <span>✨ 360° Interactive Rotation</span>
            <span>•</span>
            <span>{rotationAngle}° Angle</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            Frame {String(currentFrame).padStart(3, '0')} / {sequence360Config.FRAME_COUNT}
          </p>
        </div>

        {/* Canvas 360 Viewer */}
        <div
          style={{
            position: 'relative',
            width: 'min(90vw, 540px)',
            aspectRatio: '3/4',
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'pan-y',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={800}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />

          {/* Loading Overlay */}
          {!hasLoadedFirstFrame && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(13, 13, 13, 0.7)',
                color: 'white',
                gap: '12px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(201, 169, 110, 0.3)',
                  borderTopColor: '#C9A96E',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)' }}>
                Loading 360 Experience — {loadPercent}%
              </p>
            </div>
          )}
        </div>

        {/* Bottom Interactive HUD & Actions */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '90vw',
          }}
        >
          {/* Progress Bar */}
          <div
            style={{
              width: '240px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                backgroundColor: 'var(--color-accent)',
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          {/* Scroll / Drag Hints */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: 'var(--font-size-xs)',
              letterSpacing: '0.08em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>↓ Scroll down to rotate</span>
            <span>•</span>
            <span>⇄ Or drag horizontally</span>
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <WhatsAppInquiryButton
              whatsappNumber={whatsappNumber}
              dressCode={dressCode}
              dressName={dressName}
              size="md"
              label="Enquire on WhatsApp"
            />
            <Link
              href="/bridal"
              className="btn-secondary"
              style={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.35)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
