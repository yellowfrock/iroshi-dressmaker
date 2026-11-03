'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  sequence360Config,
  scrollProgressToFrameIndex,
  clampFrameIndex,
} from '@/config/sequence-360'

interface UseScrollFrameAnimationOptions {
  containerRef: React.RefObject<HTMLElement | null>
  totalFrames?: number
  onFrameChange?: (frame: number) => void
}

export function useScrollFrameAnimation({
  containerRef,
  totalFrames = sequence360Config.FRAME_COUNT,
  onFrameChange,
}: UseScrollFrameAnimationOptions) {
  const [currentFrame, setCurrentFrame] = useState(1)
  const [progress, setProgress] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const rafId = useRef<number | null>(null)
  const lastCalculatedFrame = useRef(1)

  // Handle scroll progress calculation
  const updateScrollProgress = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const windowHeight = window.innerHeight

    // Check if the container is currently visible in viewport
    const visible = rect.top <= 0 && rect.bottom >= windowHeight
    setIsInView(rect.top < windowHeight && rect.bottom > 0)

    if (visible) {
      // Calculate scroll progress through the container
      const totalScrollableDistance = rect.height - windowHeight
      const scrolled = -rect.top
      const rawProgress = Math.max(0, Math.min(1, scrolled / totalScrollableDistance))

      setProgress(rawProgress)

      const targetFrame = scrollProgressToFrameIndex(rawProgress)
      if (targetFrame !== lastCalculatedFrame.current) {
        lastCalculatedFrame.current = targetFrame
        setCurrentFrame(targetFrame)
        onFrameChange?.(targetFrame)
      }
    } else if (rect.top > 0) {
      // Above the section
      if (lastCalculatedFrame.current !== 1) {
        lastCalculatedFrame.current = 1
        setCurrentFrame(1)
        setProgress(0)
        onFrameChange?.(1)
      }
    } else if (rect.bottom < windowHeight) {
      // Below the section
      if (lastCalculatedFrame.current !== totalFrames) {
        lastCalculatedFrame.current = totalFrames
        setCurrentFrame(totalFrames)
        setProgress(1)
        onFrameChange?.(totalFrames)
      }
    }
  }, [containerRef, totalFrames, onFrameChange])

  // Scroll listener throttled by requestAnimationFrame
  useEffect(() => {
    function onScroll() {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(updateScrollProgress)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateScrollProgress()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [updateScrollProgress])

  // Direct manual jump or drag step
  const setFrameManual = useCallback(
    (frame: number) => {
      const clamped = clampFrameIndex(frame)
      lastCalculatedFrame.current = clamped
      setCurrentFrame(clamped)
      setProgress((clamped - 1) / (totalFrames - 1))
      onFrameChange?.(clamped)
    },
    [totalFrames, onFrameChange]
  )

  return {
    currentFrame,
    progress,
    isInView,
    setFrameManual,
    totalFrames,
  }
}
