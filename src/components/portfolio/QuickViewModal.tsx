'use client'

import React from 'react'
import { X, Sparkles, ShieldCheck } from 'lucide-react'
import type { PortfolioItem } from '@/data/portfolio-items'

interface QuickViewModalProps {
  item: PortfolioItem | null
  onClose: () => void
}

/**
 * QuickViewModal — full-screen overlay showing detailed product info.
 * Displays photography, specifications, and trust badges.
 */
export const QuickViewModal: React.FC<QuickViewModalProps> = ({ item, onClose }) => {
  if (!item) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-portfolio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#14151f] border border-white/10 rounded-[28px] shadow-2xl text-left text-neutral-100 flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-neutral-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image column */}
        <div className="relative w-full md:w-1/2 min-h-[340px] md:min-h-[500px] bg-neutral-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.name}
            referrerPolicy="no-referrer"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none md:hidden" />
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {item.tags?.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-amber-200 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Details column */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
              <span className="text-amber-400 uppercase tracking-wider font-semibold">{item.craft}</span>
              <span>·</span>
              <span>{item.origin}</span>
            </div>

            {/* Title & Price */}
            <h2
              id="modal-portfolio-title"
              className="font-serif italic text-3xl sm:text-4xl font-bold text-white mb-3"
            >
              {item.name}
            </h2>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl font-bold text-amber-300 tabular-nums">{item.price}</span>
              {item.originalPrice && (
                <span className="text-sm text-neutral-400 line-through tabular-nums">
                  {item.originalPrice}
                </span>
              )}
              <span className="text-xs text-emerald-400 ml-auto font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Handcrafted Couture Piece
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-300 leading-relaxed mb-6">{item.description}</p>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs mb-6">
              <div>
                <span className="text-neutral-500 block mb-0.5">Fabric Composition</span>
                <span className="font-medium text-neutral-200">{item.fabric}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-0.5">Color Palette</span>
                <span className="font-medium text-neutral-200">{item.colorName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-0.5">Craft Tradition</span>
                <span className="font-medium text-neutral-200">{item.craft}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-0.5">Fitting</span>
                <span className="font-medium text-neutral-200">Three-stage Custom</span>
              </div>
            </div>

            {/* Trust */}
            <div className="space-y-2 text-xs text-neutral-400 mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Imported fabrics, artisan hand-finishing</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Private consultation with Indira Iroshini</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Close Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
