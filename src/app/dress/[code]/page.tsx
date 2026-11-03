import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDressByCode, getSiteSettings, getAllDressCodes } from '@/lib/supabase/queries'
import { sampleDresses } from '@/lib/data/sample-dresses'
import DressGallery from '@/components/dresses/DressGallery'
import DressCard from '@/components/dresses/DressCard'
import { siteConfig } from '@/config/site'
import { getDressEnquiryWhatsAppUrl, getRentalBookingWhatsAppUrl } from '@/lib/whatsapp'

interface PageProps {
  params: Promise<{ code: string }>
}

export const revalidate = 60

export async function generateStaticParams() {
  const codes = await getAllDressCodes()
  const sampleCodes = sampleDresses.map((d) => d.dress_code)
  const combined = Array.from(new Set([...codes, ...sampleCodes]))
  return combined.map((code) => ({ code }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const code = resolvedParams.code

  let dress = await getDressByCode(code)
  if (!dress) {
    dress = sampleDresses.find((d) => d.dress_code.toUpperCase() === code.toUpperCase()) || null
  }

  if (!dress) {
    return {
      title: 'Dress Not Found | Iroshi Dress Maker',
    }
  }

  return {
    title: `${dress.name} (${dress.dress_code}) | Iroshi Dress Maker`,
    description:
      dress.description ||
      `View couture details, photos, and book a fitting for ${dress.name} (${dress.dress_code}) at Iroshi Dressmaker studios.`,
    openGraph: {
      title: `${dress.name} (${dress.dress_code}) | Iroshi Dress Maker`,
      description: dress.description || `View details and check availability for ${dress.name}.`,
      images: dress.images && dress.images.length > 0 ? [dress.images[0].image_url] : [],
    },
  }
}

export default async function DressDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const code = resolvedParams.code

  // 1. Fetch dress from DB
  let dress = await getDressByCode(code)

  // 2. Fallback to sample data if not in DB
  if (!dress) {
    dress = sampleDresses.find((d) => d.dress_code.toUpperCase() === code.toUpperCase()) || null
  }

  if (!dress) {
    notFound()
  }

  // Fetch site settings for WhatsApp number
  const settings = await getSiteSettings()
  const whatsappNumber =
    settings?.whatsapp_number || siteConfig.placeholders.whatsappNumber || '94769750186'

  const isAvailable = dress.availability === 'available'
  const categorySlug =
    dress.category?.slug || (dress.dress_code.startsWith('BR') ? 'bridal' : 'rental')
  const categoryName =
    dress.category?.name ||
    (categorySlug === 'bridal' ? 'Latest Collection' : 'Luxury Rental Collection')

  const effectiveWhatsAppNumber = whatsappNumber || '94769750186'
  const sortedImages = dress.images && dress.images.length > 0
    ? [...dress.images].sort((a, b) => a.image_order - b.image_order)
    : []
  const primaryImageUrl = sortedImages[0]?.image_url

  const isRentalDress =
    categorySlug === 'rental' || dress.dress_code.toUpperCase().startsWith('RN')

  const waEnquiryUrl = isRentalDress
    ? getRentalBookingWhatsAppUrl(effectiveWhatsAppNumber, dress.dress_code, dress.name, primaryImageUrl) ||
      `https://wa.me/${effectiveWhatsAppNumber}`
    : getDressEnquiryWhatsAppUrl(effectiveWhatsAppNumber, dress.dress_code, dress.name, primaryImageUrl, false) ||
      `https://wa.me/${effectiveWhatsAppNumber}`

  // Related dresses
  const relatedDresses = sampleDresses
    .filter((d) => d.dress_code !== dress.dress_code && d.category?.slug === categorySlug)
    .slice(0, 3)

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white pb-24 overflow-x-hidden">
      {/* Ambient Lighting & Dot Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 20%, #1a1a24 0%, #050505 100%)' }}
        />
        <div className="dot-grid" />
      </div>

      {/* Breadcrumb Header Bar */}
      <nav
        aria-label="Breadcrumb"
        className="relative z-10 px-4 sm:px-8 lg:px-12 py-5 border-b border-white/10 font-mono text-xs text-white/50 bg-[#050505]/60 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-white transition-colors no-underline">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${categorySlug}`} className="hover:text-white transition-colors no-underline">
            {categorySlug === 'bridal' ? 'Bridal' : 'Rental'}
          </Link>
          <span>/</span>
          <span className="text-[#F4D389] font-medium">{dress.dress_code}</span>
        </div>
      </nav>

      {/* Main Dress Showcase Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-10 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Gallery Column (7 cols on lg) */}
          <div className="lg:col-span-7">
            <DressGallery images={dress.images || []} dressName={dress.name} />
          </div>

          {/* Info & Booking Column (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              {/* Badges: Category & Availability */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/15 font-mono text-xs text-[#F4D389] uppercase tracking-wider">
                  {dress.dress_code}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs tracking-wider uppercase ${
                    isAvailable
                      ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/80 border border-red-500/40 text-red-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`}
                  />
                  <span>{isAvailable ? 'Available for Fitting' : 'In Fitting / Reserved'}</span>
                </span>
              </div>

              <span className="font-mono text-xs text-white/50 tracking-widest uppercase block mb-1">
                {categoryName}
              </span>

              <h1 className="font-serif italic font-normal text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.08] mb-4">
                {dress.name}
              </h1>

              {dress.description && (
                <p className="text-sm sm:text-base text-white/75 font-light leading-relaxed mb-6">
                  {dress.description}
                </p>
              )}
            </div>

            {/* Atelier Specification Details */}
            <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40 uppercase">Atelier Piece ID</span>
                <span className="text-white font-medium">{dress.dress_code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40 uppercase">Couture Category</span>
                <span className="text-[#F4D389]">{dress.category?.name || 'Designer Ensemble'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/40 uppercase">Fitting Studio</span>
                <span className="text-white">Colombo &amp; Kurunegala</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-white/40 uppercase">Pricing &amp; Booking</span>
                <span className="text-[#F4D389]">Available via WhatsApp Enquiry</span>
              </div>
            </div>

            {/* Direct Booking Call-to-Action */}
            <div className="flex flex-col gap-3 pt-2">
              <a
                href={waEnquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[52px] py-4 px-8 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-medium text-base text-center transition-all shadow-[0_8px_30px_rgba(216,27,43,0.4)] hover:shadow-[0_12px_40px_rgba(216,27,43,0.6)] flex items-center justify-center gap-2.5 active:scale-[0.98] no-underline"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.827 2.788.828h.003c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766z" />
                </svg>
                <span>Enquire on WhatsApp</span>
              </a>

              <p className="text-[11px] font-mono text-center text-white/45">
                Clicking opens WhatsApp with dress code <strong className="text-white/70">{dress.dress_code}</strong> pre-filled.
              </p>
            </div>

            {/* Studio Note */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-white/70">
              <span className="text-lg">📍</span>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-white">Private Fitting Sessions:</span>
                <span>
                  All consultations and trials are scheduled privately to ensure dedicated attention from our styling team.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Dresses Carousel */}
        {relatedDresses.length > 0 && (
          <div className="mt-24 pt-16 border-t border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] block mb-1">
                  More From This Collection
                </span>
                <h3 className="font-serif italic text-2xl sm:text-3xl text-white font-medium">
                  Related Silhouettes
                </h3>
              </div>

              <Link
                href={`/${categorySlug}`}
                className="font-mono text-xs text-white/60 hover:text-white transition-colors no-underline"
              >
                View Full Collection →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {relatedDresses.map((rel) => (
                <DressCard key={rel.id} dress={rel} whatsappNumber={whatsappNumber} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
