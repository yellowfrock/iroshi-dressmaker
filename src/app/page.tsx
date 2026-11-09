import type { Metadata } from 'next'
import TheSequenceHomepage from '@/components/home/TheSequenceHomepage'
import { getFeaturedDresses, getFeaturedImages, getLatestCollectionItems, getSiteSettings } from '@/lib/supabase/queries'
import { sampleDresses } from '@/lib/data/sample-dresses'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: {
    absolute: 'Iroshi Dressmaker',
  },
  description:
    'Discover the artistry, craftsmanship and unique designs behind Iroshi Dressmaker across a scroll-driven 300-frame sequence.',
  openGraph: {
    title: 'Iroshi Dressmaker',
    description:
      'Discover the artistry, craftsmanship and unique designs behind Iroshi Dressmaker across a scroll-driven 300-frame sequence.',
    images: ['https://res.cloudinary.com/ecyvwovp/image/upload/v1788533136/tag_ppng.png'],
  },
  twitter: {
    title: 'Iroshi Dressmaker',
  },
}

export const revalidate = 60

export default async function HomePage() {
  const [settings, bridalDressesDb, rentalDressesDb, featuredImages, latestCollectionItems] =
    await Promise.all([
      getSiteSettings(),
      getFeaturedDresses('bridal', 4),
      getFeaturedDresses('rental', 8),
      getFeaturedImages(),
      getLatestCollectionItems(),
    ])

  const whatsappNumber =
    settings?.whatsapp_number || siteConfig.placeholders.whatsappNumber || '94771234567'

  const bridalDresses =
    bridalDressesDb && bridalDressesDb.length > 0
      ? bridalDressesDb
      : sampleDresses.filter((d) => d.category?.slug === 'bridal')

  const rentalDresses =
    rentalDressesDb && rentalDressesDb.length > 0
      ? rentalDressesDb
      : sampleDresses.filter((d) => d.category?.slug === 'rental')

  return (
    <TheSequenceHomepage
      whatsappNumber={whatsappNumber}
      rentalDresses={rentalDresses}
      bridalDresses={bridalDresses}
      featuredImages={featuredImages}
      latestCollectionItems={latestCollectionItems}
    />
  )
}
