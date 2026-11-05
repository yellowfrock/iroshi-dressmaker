'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface SareeLightboxProps {
  isOpen: boolean
  onClose: () => void
  sareeTitle: string
  sareeCode: string
  images: string[]
  initialIndex?: number
  triggerRef?: React.RefObject<HTMLElement | null>
}

export default function SareeLightbox({
  isOpen,
  onClose,
  sareeTitle,
  sareeCode,
  images,
  initialIndex = 0,
  triggerRef,
}: SareeLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsAnimating(true)
      // Focus the close button for accessibility
      setTimeout(() => {
        closeBtnRef.current?.focus()
      }, 50)
    }
  }, [isOpen, initialIndex])

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [isOpen])

  // Navigation callbacks
  const hasMultiple = images.length > 1

  const handlePrev = useCallback(() => {
    if (!hasMultiple) return
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [hasMultiple, images.length])

  const handleNext = useCallback(() => {
    if (!hasMultiple) return
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [hasMultiple, images.length])

  const handleClose = useCallback(() => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
      // Return focus to triggering element
      triggerRef?.current?.focus()
    }, 200)
  }, [onClose, triggerRef])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose, handlePrev, handleNext])

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultiple) return
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultiple || touchStartXRef.current === null || touchStartYRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartXRef.current
    const deltaY = touchEndY - touchStartYRef.current

    // Only swipe if horizontal movement exceeds vertical movement and threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // Swipe left -> Next
        handleNext()
      } else {
        // Swipe right -> Prev
        handlePrev()
      }
    }

    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  if (!mounted || !isOpen) return null

  const activeImage = images[currentIndex] || images[0]

  const lightboxContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${sareeTitle} image gallery`}
      className={`fixed inset-0 z-[100] flex flex-col justify-between bg-[#050505]/95 backdrop-blur-xl select-none transition-opacity duration-300 ease-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* ── Top Bar: Saree Code + Name + Counter + Close Button ──────── */}
      <header
        className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-white/10 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 sm:gap-4 truncate mr-4">
          {/* Saree Code Badge */}
          <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-black/70 border border-[#F4D389]/60 font-mono text-xs sm:text-sm text-[#F4D389] tracking-wider uppercase font-semibold shrink-0">
            {sareeCode}
          </span>

          {/* Saree Title */}
          <h2 className="font-serif italic text-base sm:text-xl md:text-2xl text-white font-medium truncate drop-shadow-sm">
            {sareeTitle}
          </h2>

          {/* Image Counter (only shown when 2+ images) */}
          {hasMultiple && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 font-mono text-[11px] sm:text-xs text-white/80 shrink-0 border border-white/10 tracking-wider"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {/* Close Button */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={handleClose}
          aria-label="Close image gallery"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-[#D81B2B] text-white flex items-center justify-center transition-all duration-200 border border-white/15 hover:border-transparent active:scale-95 cursor-pointer shrink-0 shadow-lg group"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Main Viewport: Large Image + Left/Right Navigation ───────── */}
      <div
        className="relative flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Arrow Button (shown when 2+ images) */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-6 md:left-8 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-[#F4D389] text-white hover:text-black border border-white/20 hover:border-[#F4D389] flex items-center justify-center transition-all duration-200 backdrop-blur-md active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.6)] cursor-pointer group"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5 duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Enlarged Saree Image Container */}
        <div
          className={`relative max-w-full max-h-[72vh] sm:max-h-[76vh] flex items-center justify-center transition-all duration-300 ease-out ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeImage}
            src={activeImage}
            alt={`${sareeTitle} - view ${currentIndex + 1}`}
            className="max-h-[72vh] sm:max-h-[76vh] w-auto max-w-full object-contain rounded-xl sm:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] border border-white/10 select-none animate-fadeIn"
            draggable={false}
          />
        </div>

        {/* Right Arrow Button (shown when 2+ images) */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-6 md:right-8 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-[#F4D389] text-white hover:text-black border border-white/20 hover:border-[#F4D389] flex items-center justify-center transition-all duration-200 backdrop-blur-md active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.6)] cursor-pointer group"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5 duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Bottom Strip: Thumbnails (shown when 2+ images) ─────────── */}
      {hasMultiple && (
        <footer
          className="relative z-20 flex items-center justify-center gap-2.5 sm:gap-4 px-4 py-3 sm:py-5 border-t border-white/10 bg-black/40 backdrop-blur-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((imgUrl, idx) => {
            const isActive = idx === currentIndex
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Switch to image ${idx + 1}`}
                aria-current={isActive ? 'true' : 'false'}
                className={`relative w-12 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-2 border-[#F4D389] ring-2 ring-[#F4D389]/40 scale-105 opacity-100 shadow-[0_0_15px_rgba(244,211,137,0.35)]'
                    : 'border border-white/20 opacity-60 hover:opacity-100 hover:border-white/40'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
                />
              </button>
            )
          })}
        </footer>
      )}
    </div>
  )

  return createPortal(lightboxContent, document.body)
}

