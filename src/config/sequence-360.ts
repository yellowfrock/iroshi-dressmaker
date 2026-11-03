/**
 * 360° dress animation sequence configuration.
 *
 * All 300-frame settings are managed here — do NOT scatter these
 * values across multiple components.
 *
 * Images are stored in Supabase Storage under the `360-sequence` bucket.
 * The URL pattern is:  {storageBaseUrl}/{FRAME_PREFIX}{paddedIndex}{FRAME_EXTENSION}
 *
 * Example: .../ezgif-frame-001.webp
 */
export const sequence360Config = {
  /** Total number of frames in the sequence */
  FRAME_COUNT: 300,

  /** Filename prefix for each frame */
  FRAME_PREFIX: 'ezgif-frame-',

  /** Zero-padded width of the frame number (001, 002, …, 300) */
  FRAME_PADDING: 3,

  /** File extension of uploaded 360 frames */
  FRAME_EXTENSION: '.jpg' as const,

  /**
   * Scroll height multiplier.
   * The 360 section will be (SCROLL_HEIGHT_MULTIPLIER × 100vh) tall.
   * This controls how many scroll pixels = one full rotation.
   * Increase to make the rotation slower/more deliberate.
   */
  SCROLL_HEIGHT_MULTIPLIER: 5,

  /**
   * Number of frames to eagerly preload ahead of the current frame.
   * Increase for smoother fast-scrolling; decrease to save memory.
   */
  PRELOAD_AHEAD: 15,

  /**
   * Number of frames to eagerly preload behind the current frame
   * (supports fast reverse scrolling).
   */
  PRELOAD_BEHIND: 5,

  /**
   * Supabase Storage bucket name for the 360 frame sequence.
   */
  STORAGE_BUCKET: '360-sequence',
} as const

export type Sequence360Config = typeof sequence360Config

/**
 * Generate the padded filename for a given 1-based frame index.
 * e.g. getFrameFilename(1) → 'ezgif-frame-001.webp'
 */
export function getFrameFilename(frameIndex: number): string {
  const padded = String(frameIndex).padStart(
    sequence360Config.FRAME_PADDING,
    '0'
  )
  return `${sequence360Config.FRAME_PREFIX}${padded}${sequence360Config.FRAME_EXTENSION}`
}

/**
 * Clamp a frame index to the valid range [1, FRAME_COUNT].
 */
export function clampFrameIndex(index: number): number {
  return Math.max(1, Math.min(sequence360Config.FRAME_COUNT, Math.round(index)))
}

/**
 * Convert a scroll progress value (0–1) to a 1-based frame index.
 */
export function scrollProgressToFrameIndex(progress: number): number {
  const raw = progress * (sequence360Config.FRAME_COUNT - 1) + 1
  return clampFrameIndex(raw)
}
