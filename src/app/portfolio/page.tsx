import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/config/site'
import { getWhatsAppUrl } from '@/lib/whatsapp'
import {
  getPortfolioBackground,
  getLatestCollectionItems,
  getSareeCollectionItems,
} from '@/lib/supabase/queries'
import PortfolioShowcase from '@/components/portfolio/PortfolioShowcase'

export const metadata: Metadata = {
  title: 'Our Portfolio | Iroshi Dressmaker — Haute Couture Archive & Bridal Masterpieces',
  description:
    'Explore the haute-couture portfolio of Iroshi Dressmaker: bespoke wedding gowns, reception silhouettes, and luxury bridal creations handcrafted by Indira Iroshini.',
  openGraph: {
    title: 'Our Portfolio | Iroshi Dressmaker',
    description:
      'Explore handcrafted bridal gowns, reception silhouettes, and bespoke creations created by Indira Iroshini.',
    images: ['https://res.cloudinary.com/ecyvwovp/image/upload/v1788533136/tag_ppng.png'],
  },
}

export default async function PortfolioPage() {
  const supabase = await createClient()

  // Fetch settings, portfolio background, latest collection, and saree collection in parallel
  const [
    { data: settings },
    portfolioBg,
    latestCollectionItems,
    sareeCollectionItems,
  ] = await Promise.all([
    supabase.from('site_settings').select('whatsapp_number').limit(1).maybeSingle(),
    getPortfolioBackground(),
    getLatestCollectionItems(),
    getSareeCollectionItems(),
  ])

  const waNumber =
    settings?.whatsapp_number || siteConfig.placeholders.whatsappNumber || '94769750186'
  const waUrl = getWhatsAppUrl(waNumber) || `https://wa.me/${waNumber}`

  return (
    <div className="relative z-10 min-h-screen bg-transparent text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white pb-24">
      {/* Hero Header + Saree & Latest Collection Showcase */}
      <PortfolioShowcase
        initialBackground={portfolioBg}
        waUrl={waUrl}
        latestCollectionItems={latestCollectionItems}
        sareeCollectionItems={sareeCollectionItems}
      />

      {/* Main Portfolio Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-20">
        {/* Craftsmanship & Bespoke Process Banner */}
        <section className="rounded-3xl p-8 sm:p-12 lg:p-16 bg-black/40 backdrop-blur-md border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl space-y-6">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] block">
              The Atelier Standard
            </span>
            <h3 className="text-2xl sm:text-4xl font-serif italic text-white font-medium leading-tight">
              Bespoke Couture Tailored to Your Exact Silhouette
            </h3>
            <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed">
              Every bride possesses a unique narrative. At Iroshi Dressmaker, we start with private sketches, hand-drape imported French laces and silk organzas, and hold three personal fitting sessions to guarantee an effortless, commanding presence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div>
                <span className="font-mono text-xs text-[#F4D389] uppercase tracking-wider block mb-1">
                  01. Consultation
                </span>
                <p className="text-xs text-white/60 font-light">
                  Direct one-on-one session with Indira Iroshini in Colombo or Kurunegala.
                </p>
              </div>
              <div>
                <span className="font-mono text-xs text-[#F4D389] uppercase tracking-wider block mb-1">
                  02. Hand-Crafting
                </span>
                <p className="text-xs text-white/60 font-light">
                  Meticulous pearl beading, zardosi embroidery, and structured boning.
                </p>
              </div>
              <div>
                <span className="font-mono text-xs text-[#F4D389] uppercase tracking-wider block mb-1">
                  03. The Fitting
                </span>
                <p className="text-xs text-white/60 font-light">
                  Multi-stage fittings to achieve absolute comfort and silhouette perfection.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-3 px-8 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] no-underline active:scale-95"
              >
                <span>Reserve Consultation on WhatsApp</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
