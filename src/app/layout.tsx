import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { siteConfig } from '@/config/site'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

import FloatingWhatsAppButton from '@/components/whatsapp/FloatingWhatsAppButton'
import MobileFloatingNav from '@/components/navigation/MobileFloatingNav'
import { getSiteSettings } from '@/lib/supabase/queries'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: {
    template: `%s | ${siteConfig.name}`,
    default: `${siteConfig.name} — Bridal & Rental Dresses`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Bridal & Rental Dresses`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()
  const whatsappNumber = settings?.whatsapp_number || siteConfig.placeholders.whatsappNumber || '94771234567'

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Header />
        <main id="main-content">
          {children}
        </main>
        <Footer />
        <FloatingWhatsAppButton whatsappNumber={whatsappNumber} />
        <MobileFloatingNav whatsappNumber={whatsappNumber} />
        <Analytics />
      </body>
    </html>
  )
}
