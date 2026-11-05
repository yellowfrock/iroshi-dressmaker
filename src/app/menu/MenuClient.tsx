'use client'

/**
 * MenuClient — client component for /menu mobile navigation menu.
 *
 * Receives the initial portfolio background loaded from Supabase so the hero
 * stays in sync with /portfolio without hardcoding URLs.
 * On desktop/tablet (min-width: 769px), redirects to "/".
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PortfolioBackground } from '@/types'

const DEFAULT_CLASSIC_BG = '/portfolio/background.jpg'
const DEFAULT_CUSTOM_BG = '/portfolio/custom-background.png'

/* ── SVG icons (redrawn from screenshots) ────────────────────── */

function IconButton({ active }: { active: boolean }) {
  const fill = active ? '#ffffff' : '#000000'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle */}
      <circle cx="34" cy="38" r="26" stroke={fill} strokeWidth="3.5" fill="none" />
      {/* Inner button circle */}
      <circle cx="34" cy="38" r="18" fill={fill} />
      {/* Left hole */}
      <circle cx="28" cy="38" r="4.5" fill={active ? '#efad05' : '#eceff4'} />
      {/* Right hole */}
      <circle cx="40" cy="38" r="4.5" fill={active ? '#efad05' : '#eceff4'} />
      {/* Small dot top-right (like screenshot) */}
      <circle cx="55" cy="17" r="4.5" fill={fill} />
      <circle cx="55" cy="17" r="2.5" fill={active ? '#efad05' : '#eceff4'} />
    </svg>
  )
}

function IconRental({ active }: { active: boolean }) {
  const fill = active ? '#ffffff' : '#000000'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shopping bag body */}
      <path
        d="M18 28h36l-4 30H22L18 28Z"
        fill={fill}
      />
      {/* Bag handle/lock arc */}
      <path
        d="M26 28c0-8 20-8 20 0"
        stroke={fill}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Cursor/pointer arrow overlapping bottom-right of bag */}
      <path
        d="M43 45l14-6-6 14-3-4-5 5-4-4 5-5-1-4Z"
        fill={active ? '#efad05' : '#eceff4'}
      />
    </svg>
  )
}

function IconSaree({ active }: { active: boolean }) {
  const fill = active ? '#ffffff' : '#000000'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 4-petal ornamental flower: each petal is a rounded diamond */}
      {/* Top petal */}
      <path d="M36 8 C30 20 30 28 36 36 C42 28 42 20 36 8Z" fill={fill} />
      {/* Bottom petal */}
      <path d="M36 64 C42 52 42 44 36 36 C30 44 30 52 36 64Z" fill={fill} />
      {/* Left petal */}
      <path d="M8 36 C20 30 28 30 36 36 C28 42 20 42 8 36Z" fill={fill} />
      {/* Right petal */}
      <path d="M64 36 C52 42 44 42 36 36 C44 30 52 30 64 36Z" fill={fill} />
      {/* Sub-petals (ornamental diamond tips) */}
      <path d="M36 4 C34 10 34 14 36 18 C38 14 38 10 36 4Z" fill={fill} />
      {/* Small dot tips */}
      <path d="M36 68 C38 62 38 58 36 54 C34 58 34 62 36 68Z" fill={fill} />
      <path d="M4 36 C10 34 14 34 18 36 C14 38 10 38 4 36Z" fill={fill} />
      <path d="M68 36 C62 38 58 38 54 36 C58 34 62 34 68 36Z" fill={fill} />
      {/* Center circle */}
      <circle cx="36" cy="36" r="6" fill={active ? '#efad05' : '#eceff4'} />
    </svg>
  )
}

function IconShoppingBag({ active }: { active: boolean }) {
  const fill = active ? '#ffffff' : '#000000'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Solid bag body — trapezoidal (wider at bottom) */}
      <path
        d="M20 30h32l-5 30H25L20 30Z"
        fill={fill}
      />
      {/* Handle arc */}
      <path
        d="M27 30c0-10 18-10 18 0"
        stroke={fill}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ── tile definitions ─────────────────────────────────────────── */
const TILES = [
  {
    id: 'portfolio',
    label: 'Our Portfolio',
    href: '/portfolio',
    ariaLabel: 'Go to Our Portfolio',
    Icon: IconButton,
  },
  {
    id: 'rental',
    label: 'Rental Collection',
    href: '/rental',
    ariaLabel: 'Go to Rental Collection',
    Icon: IconRental,
  },
  {
    id: 'saree',
    label: 'Saree Collection',
    href: '/saree-collection',
    ariaLabel: 'Go to Saree Collection on Our Portfolio',
    Icon: IconSaree,
  },
  {
    id: 'all',
    label: 'View All Designs',
    href: 'https://www.behance.net/indirairoshini',
    target: '_blank',
    rel: 'noopener noreferrer',
    ariaLabel: 'View All Designs on Behance (opens in a new tab)',
    Icon: IconShoppingBag,
  },
]

interface MenuClientProps {
  initialBackground?: PortfolioBackground | null
}

/* ── client component ─────────────────────────────────────────── */
export default function MenuClient({ initialBackground }: MenuClientProps) {
  const router = useRouter()
  const [hoveredTile, setHoveredTile] = useState<string | null>(null)

  // Desktop redirect — runs only in the browser
  useEffect(() => {
    if (window.innerWidth >= 769) {
      router.replace('/')
    }
  }, [router])

  function handleTileClick(href: string | null) {
    setHoveredTile(null)
    if (href) {
      router.push(href)
    }
  }

  // Same logic as /portfolio: default image shown when /portfolio first loads
  const isCustom = initialBackground?.active_theme === 'custom'
  const heroBg = isCustom
    ? (initialBackground?.custom_url || DEFAULT_CUSTOM_BG)
    : (initialBackground?.classic_url || DEFAULT_CLASSIC_BG)

  const posX = isCustom
    ? (initialBackground?.custom_pos_x !== undefined ? Number(initialBackground.custom_pos_x) : 50)
    : (initialBackground?.classic_pos_x !== undefined ? Number(initialBackground.classic_pos_x) : 50)

  const posY = isCustom
    ? (initialBackground?.custom_pos_y !== undefined ? Number(initialBackground.custom_pos_y) : 0)
    : (initialBackground?.classic_pos_y !== undefined ? Number(initialBackground.classic_pos_y) : 14)

  return (
    <div className="menu-page-root">
      {/* ── Hero ────────────────────────────────────────── */}
      <div className="menu-hero" role="banner">
        {/* Background portrait */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="menu-hero-img"
          style={{
            objectPosition: `${posX}% ${posY}%`,
          }}
        />

        {/* Dark gradient overlay (bottom fade to black) */}
        <div className="menu-hero-gradient" aria-hidden="true" />

        {/* Top-left eyebrow text */}
        <div className="menu-hero-eyebrow" aria-label="Timeless designs crafted with care for your special moments">
          <span>TIMELESS DESIGNS /</span>
          <span>CRAFTED WITH CARE /</span>
          <span>FOR YOUR SPECIAL /</span>
          <span>MOMENTS.</span>
          <div className="menu-hero-eyebrow-line" aria-hidden="true" />
        </div>

        {/* Bottom-left heading */}
        <h1 className="menu-hero-heading">Hey , Yellows !</h1>
      </div>

      {/* ── Tiles grid ──────────────────────────────────── */}
      <div className="menu-tiles-wrap" role="navigation" aria-label="Browse sections">
        <div className="menu-tiles-grid">
          {TILES.map(({ id, label, href, ariaLabel, Icon, target, rel }) => {
            const active = hoveredTile === id

            if (target === '_blank') {
              return (
                <a
                  key={id}
                  href={href ?? undefined}
                  target="_blank"
                  rel={rel || 'noopener noreferrer'}
                  className={`menu-tile${active ? ' menu-tile--active' : ''}`}
                  aria-label={ariaLabel}
                  onPointerEnter={() => setHoveredTile(id)}
                  onPointerLeave={(e) => {
                    setHoveredTile((curr) => (curr === id ? null : curr))
                    e.currentTarget.blur()
                  }}
                  onPointerDown={() => setHoveredTile(id)}
                  onPointerUp={(e) => {
                    setHoveredTile(null)
                    e.currentTarget.blur()
                  }}
                  onPointerCancel={() => setHoveredTile(null)}
                  onFocus={() => setHoveredTile(id)}
                  onBlur={() => setHoveredTile((curr) => (curr === id ? null : curr))}
                  onClick={() => setHoveredTile(null)}
                >
                  <span className="menu-tile-icon" aria-hidden="true">
                    <Icon active={active} />
                  </span>
                  <span className="menu-tile-label">{label}</span>
                </a>
              )
            }

            return (
              <button
                key={id}
                type="button"
                className={`menu-tile${active ? ' menu-tile--active' : ''}`}
                aria-label={ariaLabel}
                aria-pressed={active}
                onPointerEnter={() => setHoveredTile(id)}
                onPointerLeave={(e) => {
                  setHoveredTile((curr) => (curr === id ? null : curr))
                  e.currentTarget.blur()
                }}
                onPointerDown={() => setHoveredTile(id)}
                onPointerUp={(e) => {
                  setHoveredTile(null)
                  e.currentTarget.blur()
                }}
                onPointerCancel={() => setHoveredTile(null)}
                onFocus={() => setHoveredTile(id)}
                onBlur={() => setHoveredTile((curr) => (curr === id ? null : curr))}
                onClick={() => handleTileClick(href)}
              >
                <span className="menu-tile-icon" aria-hidden="true">
                  <Icon active={active} />
                </span>
                <span className="menu-tile-label">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
