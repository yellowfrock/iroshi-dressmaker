import Link from 'next/link'
import type { Dress, DressImage } from '@/types'
import { getDressEnquiryWhatsAppUrl, getRentalBookingWhatsAppUrl } from '@/lib/whatsapp'

interface DressCardProps {
  dress: Dress
  whatsappNumber?: string | null
  isRental?: boolean
}

export default function DressCard({
  dress,
  whatsappNumber = '94769750186',
  isRental,
}: DressCardProps) {
  // Find primary image (lowest image_order or first image in array)
  const images = dress.images || []
  const primaryImage: DressImage | undefined =
    images.length > 0
      ? [...images].sort((a, b) => a.image_order - b.image_order)[0]
      : undefined

  const imageUrl = primaryImage?.image_url
  const isAvailable = dress.availability === 'available'
  const effectiveNumber = whatsappNumber || '94769750186'

  const isRentalItem =
    isRental ??
    (dress.category?.slug === 'rental' ||
      dress.dress_code.toUpperCase().startsWith('RN') ||
      dress.category?.name?.toLowerCase().includes('rental'))

  const waEnquiryUrl = isRentalItem
    ? getRentalBookingWhatsAppUrl(effectiveNumber, dress.dress_code, dress.name, imageUrl) ||
      `https://wa.me/${effectiveNumber}`
    : getDressEnquiryWhatsAppUrl(effectiveNumber, dress.dress_code, dress.name, imageUrl, false) ||
      `https://wa.me/${effectiveNumber}`

  return (
    <article className="dress-card group relative bg-[#0a0a0a] border border-white/10 hover:border-[#F4D389]/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-[transform,box-shadow,border-color] duration-500 ease-out flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1.5">
      {/* Dress Photo / Thumbnail Container */}
      <div className="dress-card-media relative aspect-[3/4] sm:aspect-[9/13] w-full overflow-hidden bg-[#111] select-none">
        <Link
          href={`/dress/${dress.dress_code}`}
          className="block w-full h-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={dress.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.92] group-hover:brightness-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#18181b] to-[#0a0a0a]">
              <span className="text-4xl mb-2 opacity-60">👗</span>
              <span className="font-mono text-xs text-[#F4D389] tracking-widest uppercase">
                {dress.dress_code}
              </span>
            </div>
          )}

          {/* Ambient Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30 pointer-events-none" />
        </Link>

        {/* Top Badges: Dress Code + Availability */}
        <div className="dress-card-badges absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
          {/* Dress Code Pill */}
          <span className="dress-card-code-badge inline-flex items-center px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#F4D389]/40 font-mono text-[10px] sm:text-xs text-[#F4D389] tracking-wider uppercase shadow-md">
            {dress.dress_code}
          </span>

          {/* Availability Badge */}
          <span
            className={`dress-card-avail-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md font-mono text-[10px] tracking-wider uppercase shadow-md ${
              isAvailable
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/80 border border-red-500/40 text-red-300'
            }`}
          >
            <span
              className={`dress-card-avail-dot w-1.5 h-1.5 rounded-full ${
                isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{isAvailable ? 'Available' : 'Reserved'}</span>
          </span>
        </div>
      </div>

      {/* Card Info & Details */}
      <div className="dress-card-body p-4 sm:p-6 flex flex-col flex-1 justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="dress-card-tag font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#F4D389]">
              {dress.category?.name || 'Couture Piece'}
            </span>
          </div>

          <h3 className="dress-card-title font-serif italic text-lg sm:text-xl md:text-2xl text-white font-medium line-clamp-1 group-hover:text-[#F4D389] transition-colors">
            <Link href={`/dress/${dress.dress_code}`} className="text-white hover:text-[#F4D389] no-underline">
              {dress.name}
            </Link>
          </h3>

          {dress.description && (
            <p className="dress-card-desc mt-2 text-xs sm:text-sm text-white/65 font-light line-clamp-2 leading-relaxed">
              {dress.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="dress-card-actions pt-3 border-t border-white/10 flex items-center gap-2 sm:gap-3">
          <Link
            href={`/dress/${dress.dress_code}`}
            className="dress-card-details-btn flex-1 py-2.5 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-xs text-center transition-all no-underline"
          >
            View Details
          </Link>

          <a
            href={waEnquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dress-card-wa-btn py-2.5 px-3.5 sm:px-4 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 no-underline shrink-0"
            title={`Enquire on WhatsApp for ${dress.name}`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.827 2.788.828h.003c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766z" />
            </svg>
            <span className="hidden xs:inline sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  )
}
