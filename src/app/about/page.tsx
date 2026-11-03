import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'About The Atelier | Iroshi Dress Maker',
  description:
    'Discover the artistry and heritage behind Iroshi Dressmaker, led by master designer Indira Iroshini. Haute couture bridal and rental boutique in Colombo & Kurunegala.',
}

export default function AboutPage() {
  const waNumber = siteConfig.placeholders.whatsappNumber || '94769750186'
  const waUrl = `https://wa.me/${waNumber}`

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

      {/* Header Section */}
      <section className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-8 lg:px-12 border-b border-white/10 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#F4D389] mb-4">
            <span>✦</span>
            <span>Heritage &amp; Haute Couture</span>
          </div>

          <h1 className="font-serif italic font-normal text-[clamp(2.5rem,7vw,5.5rem)] leading-[1] text-white tracking-[-0.03em] mb-4 drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            Our Story &amp; Craft
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/75 font-light leading-relaxed max-w-2xl mx-auto">
            From the initial charcoal sketch to the final hand-finished hemline, Iroshi Dressmaker embodies fifteen years of dedicated craftsmanship and bespoke bridal artistry.
          </p>
        </div>
      </section>

      {/* Main Narrative & Studio Photo */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-16 sm:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20 sm:mb-28">
          {/* Narrative Text (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#F4D389]" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389]">
                Master Designer Indira Iroshini
              </span>
            </div>

            <h2 className="font-serif italic text-3xl sm:text-4xl text-white font-medium leading-tight">
              &ldquo;Every dress should tell an unforgettable story of grace, confidence, and elegance.&rdquo;
            </h2>

            <div className="space-y-4 text-white/70 font-light text-sm sm:text-base leading-relaxed">
              <p>
                Founded by creative visionary <strong className="text-white font-normal">Indira Iroshini</strong>, Iroshi Dressmaker was born out of a profound passion for exquisite fabrics, precision corsetry, and the transformative power of bespoke tailoring.
              </p>
              <p>
                Over more than a decade, our atelier has dressed hundreds of brides and style icons across Sri Lanka, curating both one-of-a-kind wedding gowns and an exclusive rental wardrobe for galas, wedding receptions, and black-tie celebrations.
              </p>
              <p>
                Today, with studios in both <strong className="text-[#F4D389] font-normal">Colombo</strong> and <strong className="text-[#F4D389] font-normal">Kurunegala</strong>, we continue our commitment to private personalized service, where every client is welcomed into an intimate fitting environment.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="appointment-btn text-xs no-underline">
                <span>Book Private Consultation</span>
              </a>
              <Link href="/portfolio#latest-collection" className="text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white underline transition-colors">
                Explore Latest Collection →
              </Link>
            </div>
          </div>

          {/* Atelier Photo Gallery (2 up and 2 down, 1:1 square ratio) (6 cols) */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              {[
                {
                  src: '/images/atelier/workshop-seamstresses.jpg',
                  alt: 'Master Artisans at Iroshi Dressmaker Atelier',
                  label: 'Workshop Atelier',
                },
                {
                  src: '/images/atelier/team-portrait.jpg',
                  alt: 'Iroshi Dressmaker Studio Team & Founder',
                  label: 'Creative Team',
                },
                {
                  src: '/images/atelier/studio-lounge.jpg',
                  alt: 'Flagship Fitting Lounge & Showroom',
                  label: 'Fitting Lounge',
                },
                {
                  src: '/images/atelier/vintage-sewing-machine.jpg',
                  alt: 'Heritage Sewing Machine & Craftsmanship',
                  label: 'Heritage & Artistry',
                },
              ].map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 relative shadow-xl group bg-white/[0.02]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.93] group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10 pointer-events-none opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between text-[11px] sm:text-xs font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border border-white/10">
                    <span className="truncate">{img.label}</span>
                    <span className="text-[#F4D389] ml-1.5 shrink-0">✦</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 sm:mb-28">
          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col items-start">
            <span className="font-mono text-xs uppercase tracking-widest text-[#F4D389] mb-3">Pillar 01</span>
            <h3 className="font-serif italic text-2xl text-white font-medium mb-3">Custom Patterning</h3>
            <p className="text-sm text-white/65 font-light leading-relaxed">
              Every bespoke gown begins with 28 individual anatomical measurements, ensuring structural harmony, posture support, and comfortable movement.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col items-start">
            <span className="font-mono text-xs uppercase tracking-widest text-[#F4D389] mb-3">Pillar 02</span>
            <h3 className="font-serif italic text-2xl text-white font-medium mb-3">Finest Textiles</h3>
            <p className="text-sm text-white/65 font-light leading-relaxed">
              We source premier French Chantilly lace, Italian silk organza, Japanese mikado, and handcrafted crystal beading to bring each silhouette to life.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col items-start">
            <span className="font-mono text-xs uppercase tracking-widest text-[#F4D389] mb-3">Pillar 03</span>
            <h3 className="font-serif italic text-2xl text-white font-medium mb-3">Luxury On Demand</h3>
            <p className="text-sm text-white/65 font-light leading-relaxed">
              Our curated rental archive allows clients to experience couture luxury sustainably for unforgettable weddings, galas, and red-carpet appearances.
            </p>
          </div>
        </div>

        {/* Studio Locations Grid */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0a0a0a] border border-white/10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] block mb-2">
              Visit Our Studios
            </span>
            <h3 className="font-serif italic text-3xl sm:text-4xl text-white font-medium">
              Flagship Atelier Locations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#F4D389] uppercase tracking-wider block mb-2">
                  Western Province
                </span>
                <h4 className="text-xl text-white font-medium mb-2">Colombo Flagship Studio</h4>
                <p className="text-sm text-white/60 font-light leading-relaxed mb-4">
                  Full bridal consultations, private fitting suites, and custom veil design sessions.
                </p>
              </div>
              <a
                href="https://maps.app.goo.gl/A8KtCSsV7azDaXVc6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-[#F4D389] hover:underline"
              >
                <span>Open in Google Maps</span>
                <span>↗</span>
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#F4D389] uppercase tracking-wider block mb-2">
                  North Western Province
                </span>
                <h4 className="text-xl text-white font-medium mb-2">Kurunegala Atelier</h4>
                <p className="text-sm text-white/60 font-light leading-relaxed mb-4">
                  Rental collection showroom, dress alteration workshop, and scheduled bridal fittings.
                </p>
              </div>
              <a
                href="https://maps.app.goo.gl/MNAjgBJd5NPSr3cs7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-[#F4D389] hover:underline"
              >
                <span>Open in Google Maps</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
