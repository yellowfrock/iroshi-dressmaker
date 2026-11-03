'use client'

import { useState } from 'react'
import type { DressImage } from '@/types'

interface DressGalleryProps {
  images: DressImage[]
  dressName: string
}

export default function DressGallery({ images, dressName }: DressGalleryProps) {
  const sortedImages = [...images].sort((a, b) => a.image_order - b.image_order)
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (sortedImages.length === 0) {
    return (
      <div className="w-full aspect-[3/4] rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col items-center justify-center p-8 text-center text-white/50">
        <span className="text-5xl mb-3 opacity-60">👗</span>
        <p className="font-serif italic text-lg text-white">Photographs coming soon</p>
        <p className="text-xs font-mono text-white/40 mt-1">Atelier Archive Studio</p>
      </div>
    )
  }

  const activeImage = sortedImages[selectedIndex] || sortedImages[0]

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Main Large Image */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[9/13] rounded-3xl overflow-hidden bg-[#0d0d0d] border border-white/10 shadow-2xl group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.image_url}
          alt={`${dressName} - View ${selectedIndex + 1}`}
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.94] group-hover:brightness-100"
        />

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Photo Index Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-md border border-white/15 text-[#F4D389] font-mono text-xs px-3 py-1 rounded-full shadow-lg">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails row */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {sortedImages.map((img, idx) => {
            const isSelected = idx === selectedIndex
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 transition-[transform,border-color,opacity] duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-[#F4D389] ring-2 ring-[#F4D389]/30 scale-105'
                    : 'border-white/15 opacity-60 hover:opacity-100 hover:border-white/40'
                }`}
                aria-label={`View photo ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={`${dressName} thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
