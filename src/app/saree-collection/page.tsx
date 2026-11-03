import type { Metadata } from 'next'
import Link from 'next/link'
import { getSareeCollectionDatabaseItems, getSiteSettings } from '@/lib/supabase/queries'
import SareeCard from '@/components/saree/SareeCard'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Saree Collection | Iroshi Dress Maker — Handcrafted Bridal & Designer Sarees',
  description:
    'Explore the complete bespoke saree collection of Iroshi Dress Maker: handcrafted bridal drapes, pure silk heirlooms, and artisanal embroidery. Enquire directly via WhatsApp.',
  openGraph: {
    title: 'Saree Collection | Iroshi Dress Maker',
    description:
      'Explore handcrafted bridal sarees, pure silk weaves, and luxury reception drapes created by Indira Iroshini.',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'],
  },
}

export default async function SareeCollectionPage() {
  const [sarees, settings] = await Promise.all([
    getSareeCollectionDatabaseItems(),
    getSiteSettings(),
  ])

  const whatsappNumber =
    settings?.whatsapp_number || siteConfig.placeholders.whatsappNumber || '94769750186'
  const siteUrl = siteConfig.url || 'https://iroshi.lk'
  const generalWaUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hello Iroshi Dress Maker, I would like to enquire about bespoke bridal and designer sarees.'
  )}`

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white pb-24 overflow-x-hidden">
      {/* Ambient Lighting & Subtle Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 15%, #2a1f10 0%, #050505 85%)' }}
        />
        <div className="dot-grid" />
      </div>

      {/* Hero Header Banner */}
      <section className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-8 lg:px-12 border-b border-white/10 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#F4D389] text-[#18181b] text-xs sm:text-sm font-semibold tracking-tight shadow-sm mb-4">
            Atelier Heritage &amp; Bespoke Drapes
          </div>

          <h1 className="font-serif italic font-normal text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] text-white tracking-[-0.03em] mb-4 drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            Saree <span className="font-serif italic font-medium text-[#F4D389]">Collection</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/75 font-light leading-relaxed max-w-2xl mx-auto mb-8">
            A comprehensive showcase of handcrafted bridal sarees, heirloom silk weaves, and bespoke reception drapes created by Indira Iroshini. Every piece is woven with timeless grace and tailored to your silhouette.
          </p>

          {/* Telemetry pill */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-4 sm:px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-wider text-white/80">
            <span>{sarees.length} Bespoke Sarees</span>
            <span className="text-white/30">•</span>
            <span className="text-[#F4D389] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F4D389] animate-pulse" />
              Pure Silk &amp; Organza
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/70">Handcrafted in Colombo Atelier</span>
          </div>
        </div>
      </section>

      {/* Main Saree Collection Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-10 sm:pt-14">
        {/* Navigation Breadcrumb / Back to Portfolio link */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10 font-mono text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors no-underline">
              Home
            </Link>
            <span>/</span>
            <Link href="/portfolio" className="hover:text-white transition-colors no-underline">
              Portfolio
            </Link>
            <span>/</span>
            <span className="text-[#F4D389]">Saree Collection</span>
          </div>

          <Link
            href="/portfolio#saree-collection"
            className="inline-flex items-center gap-2 text-white/70 hover:text-[#F4D389] transition-colors no-underline group font-mono text-xs"
          >
            <span className="transition-transform group-hover:-translate-x-1 font-sans">←</span>
            <span>Back to Portfolio</span>
          </Link>
        </div>

        {/* Empty State vs. Responsive Grid */}
        {sarees.length === 0 ? (
          <div className="max-w-lg mx-auto my-12 py-16 px-6 text-center rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#F4D389]/10 border border-[#F4D389]/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              🥻
            </div>
            <h3 className="text-xl font-serif italic text-white font-medium mb-2">
              No Sarees Currently Published
            </h3>
            <p className="text-sm text-white/60 font-light leading-relaxed mb-6">
              Our bespoke saree collection is currently being curated. Please check back soon or contact our atelier directly to discuss custom commissions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/portfolio#saree-collection"
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-mono tracking-wider transition-all no-underline"
              >
                ← Return to Portfolio
              </Link>
              <a
                href={generalWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-md no-underline"
              >
                Enquire via WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {sarees.map((saree, index) => (
              <SareeCard
                key={saree.id}
                saree={saree}
                index={index}
                whatsappNumber={whatsappNumber}
                siteUrl={siteUrl}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
