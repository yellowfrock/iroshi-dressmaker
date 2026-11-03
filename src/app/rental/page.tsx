import type { Metadata } from 'next'
import Link from 'next/link'
import { getDressesByCategory, getSiteSettings } from '@/lib/supabase/queries'
import { sampleDresses } from '@/lib/data/sample-dresses'
import DressCard from '@/components/dresses/DressCard'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Luxury Rental Collection | Iroshi Dress Maker',
  description:
    'Discover luxury designer evening gowns, reception dresses, and gala silhouettes available for rental. Check availability and reserve your date via WhatsApp.',
}

export const revalidate = 60

export default async function RentalCollectionPage() {
  const [dressesDb, settings] = await Promise.all([
    getDressesByCategory('rental'),
    getSiteSettings(),
  ])

  // Fallback to sample rental dresses if DB is empty
  const dresses =
    dressesDb && dressesDb.length > 0
      ? dressesDb
      : sampleDresses.filter((d) => d.category?.slug === 'rental')
  const whatsappNumber =
    settings?.whatsapp_number || siteConfig.placeholders.whatsappNumber || '94769750186'
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hello Iroshi Dress Maker, I would like to enquire about renting a dress for an upcoming event.'
  )}`

  const availableCount = dresses.filter((d) => d.availability === 'available').length

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

      {/* Hero Header Banner */}
      <section className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-8 lg:px-12 border-b border-white/10 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#F4D389] text-[#18181b] text-xs sm:text-sm font-semibold tracking-tight shadow-sm mb-4">
            Join over 100,000 happy creators
          </div>

          <h1 className="font-serif italic font-normal text-[clamp(2.5rem,7vw,5.5rem)] leading-[1] text-white tracking-[-0.03em] mb-4 drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            Rental Collection
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/75 font-light leading-relaxed max-w-2xl mx-auto mb-8">
            Curated evening gowns, glamorous wedding reception dresses, and gala silhouettes ready to make you feel unforgettable on your special occasion.
          </p>

          {/* Telemetry pill */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-4 sm:px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-wider text-white/80">
            <span>{dresses.length} Designer Gowns</span>
            <span className="text-white/30">•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {availableCount} Available for Rental
            </span>
            <span className="text-white/30">•</span>
            <span className="text-[#F4D389]">Dry Cleaned &amp; Tailor-Fitted</span>
          </div>
        </div>
      </section>

      {/* Collection Grid Section */}
      <section className="rental-cards-section relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-12 sm:pt-16">
        {/* Navigation Breadcrumb / Archive link */}
        <div className="rental-breadcrumb-row flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10 font-mono text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors no-underline">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#F4D389]">Rental</span>
          </div>

          <a
            href="https://drive.google.com/drive/folders/18pv3PkbA6OuF13Ty2-DhG1WWpmEMEk8I?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-[#F4D389] transition-colors flex items-center gap-1.5 no-underline"
          >
            <span>Full Cloud Archive Gallery (Google Drive)</span>
            <span>↗</span>
          </a>
        </div>

        {/* Dress Cards Grid */}
        <div className="rental-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {dresses.map((dress) => (
            <DressCard
              key={dress.id}
              dress={dress}
              whatsappNumber={whatsappNumber}
              isRental={true}
            />
          ))}
        </div>

        {/* How Rental Works Section */}
        <div className="mt-16 sm:mt-24 p-8 sm:p-12 rounded-3xl bg-[#0a0a0a] border border-white/10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] block mb-2">
              Simple 3-Step Process
            </span>
            <h3 className="font-serif italic text-2xl sm:text-3xl text-white font-medium">
              How Renting Works
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-start">
              <span className="font-mono text-2xl text-[#F4D389] font-bold mb-3">01 //</span>
              <h4 className="text-white font-medium text-lg mb-2">Choose Your Dress</h4>
              <p className="text-sm text-white/60 font-light leading-relaxed">
                Browse our catalog, note the unique Dress Code (e.g. RN001), and select your desired event date.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-start">
              <span className="font-mono text-2xl text-[#F4D389] font-bold mb-3">02 //</span>
              <h4 className="text-white font-medium text-lg mb-2">WhatsApp Consultation</h4>
              <p className="text-sm text-white/60 font-light leading-relaxed">
                Click the WhatsApp button to verify date availability, receive rental pricing, and book your fitting appointment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-start">
              <span className="font-mono text-2xl text-[#F4D389] font-bold mb-3">03 //</span>
              <h4 className="text-white font-medium text-lg mb-2">Fitted &amp; Handed Over</h4>
              <p className="text-sm text-white/60 font-light leading-relaxed">
                Visit our Colombo or Kurunegala studio for measurements and trial. Collect your pristine gown ready to shine.
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="appointment-btn text-xs px-8 py-3.5 no-underline"
            >
              <span>Check Rental Dates on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
