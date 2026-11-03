'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const pathname = usePathname()

  // The homepage and mobile menu page use their own full-bleed layout
  if (pathname === '/' || pathname === '/menu') return null

  const waNumber = siteConfig.placeholders.whatsappNumber || '94769750186'
  const waUrl = `https://wa.me/${waNumber}`

  return (
    <footer className="w-full bg-[#050505] text-[#e5e5e5] border-t border-white/10 select-none">
      {/* Upper Footer: Brand, Locations & Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand & Seal */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788536047/logo.png"
                alt="Iroshi Dressmaker Seal"
                className="w-12 h-12 object-contain rounded-full drop-shadow-[0_0_15px_rgba(244,211,137,0.3)]"
              />
              <div className="flex flex-col">
                <span className="font-serif italic text-xl font-bold text-white tracking-wide">
                  Iroshi Dressmaker
                </span>
                <span className="font-mono text-[9px] text-[#F4D389] tracking-widest uppercase">
                  Haute Couture &amp; Rentals
                </span>
              </div>
            </div>

            <p className="text-sm text-white/70 font-light leading-relaxed mb-6 max-w-sm">
              Sri Lankan bridal and luxury couture house crafting bespoke wedding gowns, red-carpet ensembles, and an exclusive rental collection for life&apos;s most cherished moments.
            </p>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="appointment-btn text-xs"
            >
              <span>💬 Enquire on WhatsApp</span>
            </a>
          </div>

          {/* Collections */}
          <div className="flex flex-col">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] mb-4">
              Collections
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li>
                <Link
                  href="/portfolio"
                  className="text-[#F4D389] hover:text-white hover:underline transition-colors font-medium"
                >
                  Our Portfolio (Archive) ↗
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio#latest-collection"
                  className="text-white/70 hover:text-white hover:underline transition-colors"
                >
                  Latest Collection
                </Link>
              </li>
              <li>
                <Link
                  href="/rental"
                  className="text-white/70 hover:text-white hover:underline transition-colors"
                >
                  Rental Evening &amp; Reception Dresses
                </Link>
              </li>
              <li>
                <Link
                  href="/dress/BR001"
                  className="text-white/70 hover:text-white hover:underline transition-colors"
                >
                  Royal French Lace Gown (BR001)
                </Link>
              </li>
              <li>
                <Link
                  href="/dress/RN001"
                  className="text-white/70 hover:text-white hover:underline transition-colors"
                >
                  Emerald Luxe Gown (RN001)
                </Link>
              </li>
            </ul>
          </div>

          {/* Studios & Google Maps */}
          <div className="flex flex-col">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] mb-4">
              Atelier Locations
            </h4>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block font-medium text-white">Colombo Flagship Studio</span>
                <a
                  href="https://maps.app.goo.gl/A8KtCSsV7azDaXVc6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#F4D389] hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  <span>Google Maps View ↗</span>
                </a>
              </div>

              <div>
                <span className="block font-medium text-white">Kurunegala Atelier</span>
                <a
                  href="https://maps.app.goo.gl/MNAjgBJd5NPSr3cs7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#F4D389] hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  <span>Google Maps View ↗</span>
                </a>
              </div>

              <div className="pt-2">
                <span className="block font-mono text-xs text-white/50">Telephone &amp; WhatsApp:</span>
                <a
                  href="tel:+94769750186"
                  className="font-mono text-sm text-white/90 hover:text-[#F4D389] transition-colors"
                >
                  +94 76 975 0186
                </a>
              </div>
            </div>
          </div>

          {/* Socials & Media */}
          <div className="flex flex-col">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] mb-4">
              Connect With Us
            </h4>
            <div className="flex items-center gap-3 mb-6">
              <a
                href="https://www.instagram.com/iroshi_dressmaker_/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              <a
                href="https://www.tiktok.com/@iroshi_ilankoon?_r=1&_t=ZS-99SIdWhF9Sn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-10 h-10 rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>

              <a
                href="https://www.facebook.com/share/1Gw4ZexuX2/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                Fittings &amp; Consultations
              </span>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                By appointment only. Please contact us via WhatsApp to reserve your exclusive fitting session.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Monograph Strip */}
      <div className="border-t border-white/10 px-4 sm:px-8 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <a
              href="https://www.iroshidressmaker.lk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              www.iroshidressmaker.lk
            </a>
            <a
              href="https://www.iroshidressmaker.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              www.iroshidressmaker.com
            </a>
          </div>

          <div className="flex items-center gap-4">
            <span>© {currentYear} Iroshi Dressmaker. All rights reserved.</span>
            <Link href="/admin/login" className="hover:text-white transition-colors opacity-40 hover:opacity-100">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
