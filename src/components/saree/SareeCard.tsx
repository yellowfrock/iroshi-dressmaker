'use client'

import React, { useState } from 'react'
import type { CollectionItem } from '@/types'

interface SareeCardProps {
  saree: CollectionItem
  index: number
  whatsappNumber: string
  siteUrl: string
}

export default function SareeCard({
  saree,
  index,
  whatsappNumber,
  siteUrl,
}: SareeCardProps) {
  const [imageError, setImageError] = useState(false)

  const effectiveNumber = whatsappNumber || '94769750186'
  const sareeCode = saree.saree_code || `SR-${String(index + 1).padStart(3, '0')}`
  const cardAnchor = saree.saree_code ? saree.saree_code.toLowerCase().replace(/[^a-z0-9]/g, '-') : `saree-${index + 1}`
  const pageUrl = `${siteUrl.replace(/\/$/, '')}/saree-collection#${cardAnchor}`

  const waText = `Hello Iroshi Dress Maker, I am interested in bespoke saree "${saree.title}" (Code: ${sareeCode}). View here: ${pageUrl}`
  const waUrl = `https://wa.me/${effectiveNumber}?text=${encodeURIComponent(waText)}`

  return (
    <article
      id={cardAnchor}
      className="group relative bg-[#0a0a0a] border border-white/10 hover:border-[#F4D389]/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-[transform,box-shadow,border-color] duration-500 ease-out flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1.5 scroll-mt-28"
    >
      {/* Saree Photograph / Thumbnail */}
      <div className="relative aspect-[3/4] sm:aspect-[9/13] w-full overflow-hidden bg-[#111] select-none">
        {saree.image_url && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={saree.image_url}
            alt={saree.title}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.92] group-hover:brightness-100"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#18181b] to-[#0a0a0a]">
            <span className="text-4xl mb-2 opacity-60">🥻</span>
            <span className="font-mono text-xs text-[#F4D389] tracking-widest uppercase">
              {sareeCode}
            </span>
            <span className="text-[11px] font-mono text-white/40 mt-1">Atelier Creation</span>
          </div>
        )}

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges: Saree Code + Material/Embroidery */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#F4D389]/40 font-mono text-[10px] sm:text-xs text-[#F4D389] tracking-wider uppercase shadow-md">
            {sareeCode}
          </span>

          {saree.subtitle_badge && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white/90 font-mono text-[9px] sm:text-[10px] tracking-wider uppercase shadow-md truncate max-w-[160px]">
              {saree.subtitle_badge}
            </span>
          )}
        </div>
      </div>

      {/* Card Info & Details */}
      <div className="p-4 sm:p-6 flex flex-col flex-1 justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#F4D389] block mb-1">
            Bespoke Saree Couture
          </span>

          <h3 className="font-serif italic text-lg sm:text-xl md:text-2xl text-white font-medium line-clamp-1 group-hover:text-[#F4D389] transition-colors">
            {saree.title}
          </h3>

          {saree.description ? (
            <p className="mt-2 text-xs sm:text-sm text-white/65 font-light line-clamp-3 leading-relaxed">
              {saree.description}
            </p>
          ) : (
            <p className="mt-2 text-xs sm:text-sm text-white/40 font-light italic">
              Handcrafted bespoke saree drape with artisanal embroidery tailored at Iroshi Dressmaker atelier.
            </p>
          )}
        </div>

        {/* WhatsApp Enquiry Button */}
        <div className="pt-3 border-t border-white/10">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 sm:py-3 px-4 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(216,27,43,0.3)] hover:shadow-[0_6px_24px_rgba(216,27,43,0.5)] active:scale-95 no-underline cursor-pointer"
            title={`Enquire on WhatsApp for ${saree.title} (${sareeCode})`}
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.827 2.788.828h.003c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766z" />
            </svg>
            <span>WhatsApp Enquiry</span>
          </a>
        </div>
      </div>
    </article>
  )
}
