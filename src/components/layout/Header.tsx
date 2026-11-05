'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isPortfolio = pathname === '/portfolio'

  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll detection for home page transparent header transition
  useEffect(() => {
    if (!isHome) {
      setIsScrolled(false)
      return
    }

    let rafId: number | null = null

    const handleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        // Fully transparent only while at the very top (scrollY <= 10px);
        // as soon as user scrolls past 10px, switch to solid dark sticky bar
        setIsScrolled(window.scrollY > 10)
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isHome])

  // The mobile menu page uses its own full-bleed layout
  if (pathname === '/menu') return null

  const isHomeTransparent = isHome && !isScrolled
  const showTransparent = isHomeTransparent && !mobileMenuOpen
  const waNumber = siteConfig.placeholders.whatsappNumber || '94769750186'
  const waUrl = `https://wa.me/${waNumber}`

  const handleResetToStart = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`z-50 w-full select-none transition-all duration-300 ${
        isHome
          ? `fixed top-0 left-0 right-0 ${
              showTransparent
                ? 'bg-transparent backdrop-blur-none border-b-0 shadow-none text-[#e5e5e5]'
                : 'bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 text-[#e5e5e5]'
            }`
          : 'sticky top-0 bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 text-[#e5e5e5]'
      }`}
    >
      <div
        className={`transition-all duration-300 flex items-center justify-between ${
          isHomeTransparent
            ? 'w-full max-w-full px-4 sm:px-8 lg:px-[60px] h-20 md:h-auto md:py-6 lg:py-[36px]'
            : 'max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-20'
        }`}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={handleResetToStart}
          className="flex flex-col cursor-pointer group shrink-0 no-underline"
        >
          <div className="inline-grid grid-cols-1 grid-rows-1 items-center w-fit transition-opacity duration-300 group-hover:opacity-85">
            {/* Original logo (black text) - displayed when header is transparent */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788533136/tag_ppng.png"
              alt="Iroshi Dressmaker"
              width={4185}
              height={836}
              className={`col-start-1 row-start-1 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] ${
                isHomeTransparent
                  ? 'h-8 sm:h-10 md:h-11 lg:h-14 max-w-[170px] sm:max-w-[220px] lg:max-w-[280px]'
                  : 'h-8 sm:h-10 max-w-[170px] sm:max-w-[220px]'
              } ${showTransparent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
            {/* White-text logo - displayed when header has dark background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-white-text.png"
              alt="Iroshi Dressmaker"
              width={4185}
              height={836}
              className={`col-start-1 row-start-1 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] ${
                isHomeTransparent
                  ? 'h-8 sm:h-10 md:h-11 lg:h-14 max-w-[170px] sm:max-w-[220px] lg:max-w-[280px]'
                  : 'h-8 sm:h-10 max-w-[170px] sm:max-w-[220px]'
              } ${!showTransparent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
          </div>
          <span
            className={`font-mono text-[0.6rem] sm:text-[0.65rem] lowercase text-[#e5e5e5] group-hover:opacity-75 transition-all duration-300 ${
              isHomeTransparent
                ? 'tracking-[0.18em] sm:tracking-[0.2em] mt-0.5 sm:mt-1 opacity-65 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
                : 'tracking-[0.18em] mt-0.5 opacity-45'
            }`}
          >
            www.iroshidressmaker.com
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className={`hidden md:flex items-center uppercase tracking-wider font-mono transition-all duration-300 ${
            isHomeTransparent
              ? 'gap-5 lg:gap-7 text-sm'
              : 'gap-6 lg:gap-8 text-xs'
          }`}
        >
          <Link
            href="/"
            onClick={handleResetToStart}
            className={`transition-colors no-underline cursor-pointer ${
              isHomeTransparent
                ? 'text-[#F4D389] font-medium'
                : pathname === '/'
                  ? 'text-[#F4D389] font-medium'
                  : 'text-[#e5e5e5]/70 hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            href="/portfolio"
            className={`transition-colors no-underline ${
              isHomeTransparent
                ? 'text-black font-semibold hover:text-black/75'
                : pathname.startsWith('/portfolio')
                  ? 'text-[#F4D389] font-medium'
                  : 'text-[#e5e5e5]/70 hover:text-[#F4D389]'
            }`}
          >
            Our Portfolio
          </Link>
          {!isPortfolio && (
            <>
              <Link
                href="/saree-collection"
                className={`transition-colors no-underline ${
                  isHomeTransparent
                    ? 'text-[#e5e5e5]/70 hover:text-[#F4D389]'
                    : pathname.startsWith('/saree-collection')
                      ? 'text-[#F4D389] font-medium'
                      : 'text-[#e5e5e5]/70 hover:text-[#F4D389]'
                }`}
              >
                Saree Collection
              </Link>
              <Link
                href="/rental"
                className={`transition-colors no-underline ${
                  isHomeTransparent
                    ? 'text-black font-semibold hover:text-black/75'
                    : pathname.startsWith('/rental')
                      ? 'text-[#F4D389] font-medium'
                      : 'text-[#e5e5e5]/70 hover:text-[#F4D389]'
                }`}
              >
                Rental Collection
              </Link>
            </>
          )}
          <Link
            href="/about"
            className={`transition-colors no-underline ${
              isHomeTransparent
                ? 'text-[#e5e5e5]/70 hover:text-white'
                : pathname === '/about'
                  ? 'text-[#F4D389] font-medium'
                  : 'text-[#e5e5e5]/70 hover:text-white'
            }`}
          >
            About Atelier
          </Link>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`appointment-btn ml-2 cursor-pointer no-underline transition-all duration-300 ${
              isHomeTransparent ? '!text-sm' : 'text-xs'
            }`}
          >
            Make an Appointment
          </a>
        </nav>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-[0.68rem] font-medium tracking-wider uppercase text-white/90 bg-white/10 hover:bg-white/15 rounded-full border border-white/15 no-underline flex items-center gap-1.5"
            aria-label="Book on WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Book</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white transition-all cursor-pointer"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#050505]/95 backdrop-blur-xl flex flex-col justify-between p-6 overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/10 pb-5">
            <div className="flex flex-col">
              <span className="font-serif italic text-2xl font-bold text-white">#iroshi</span>
              <span className="font-mono text-[0.6rem] tracking-widest text-[#F4D389] uppercase">
                dressmaker
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer border border-white/15"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-2 my-8">
            <Link
              href="/"
              onClick={() => {
                handleResetToStart()
                setMobileMenuOpen(false)
              }}
              className="flex items-center justify-between py-4 px-4 rounded-xl text-left text-lg font-medium text-white hover:bg-white/5 border-b border-white/5 transition-colors no-underline"
            >
              <span>Home</span>
              <span className="opacity-40">→</span>
            </Link>
            <Link
              href="/portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-4 px-4 rounded-xl text-left text-lg font-medium text-[#F4D389] hover:bg-white/5 border-b border-white/5 transition-colors no-underline"
            >
              <span>Our Portfolio</span>
              <span className="opacity-40">→</span>
            </Link>
            <Link
              href="/saree-collection"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-4 px-4 rounded-xl text-left text-lg font-medium text-white hover:bg-white/5 border-b border-white/5 transition-colors no-underline"
            >
              <span>Saree Collection</span>
              <span className="opacity-40">→</span>
            </Link>
            <Link
              href="/rental"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-4 px-4 rounded-xl text-left text-lg font-medium text-white hover:bg-white/5 border-b border-white/5 transition-colors no-underline"
            >
              <span>Rental Collection</span>
              <span className="opacity-40">→</span>
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-4 px-4 rounded-xl text-left text-lg font-medium text-white hover:bg-white/5 border-b border-white/5 transition-colors no-underline"
            >
              <span>About Atelier</span>
              <span className="opacity-40">→</span>
            </Link>
          </nav>

          <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-medium text-center text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 no-underline"
            >
              <span>Make an Appointment</span>
            </a>
            <a
              href="tel:+94769750186"
              className="w-full min-h-[44px] py-2 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-mono text-center text-xs tracking-wider flex items-center justify-center gap-2 no-underline"
            >
              <span>+94 76 975 0186</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
