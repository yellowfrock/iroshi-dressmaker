import type { Metadata } from 'next'
import TheSequenceHomepage from '@/components/home/TheSequenceHomepage'
import { getFeaturedDresses, getFeaturedImages, getLatestCollectionItems, getSiteSettings } from '@/lib/supabase/queries'
import { sampleDresses } from '@/lib/data/sample-dresses'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'The Sequence | Iroshi Dressmaker — Haute Couture & Rental Collection',
  description:
    'Discover the artistry, craftsmanship and unique designs behind Iroshi Dressmaker across a scroll-driven 300-frame sequence.',
  openGraph: {
    title: 'The Sequence | Iroshi Dressmaker',
    description:
      'Discover the artistry, craftsmanship and unique designs behind Iroshi Dressmaker across a scroll-driven 300-frame sequence.',
    images: ['https://res.cloudinary.com/ecyvwovp/image/upload/v1788533136/tag_ppng.png'],
  },
}

export default async function HomePage() {
  const settings = await getSiteSettings()
  const whatsappNumber = settings?.whatsapp_number || siteConfig.placeholders.whatsappNumber || '94771234567'

  let bridalDresses = await getFeaturedDresses('bridal', 4)
  if (!bridalDresses || bridalDresses.length === 0) {
    bridalDresses = sampleDresses.filter((d) => d.category?.slug === 'bridal')
  }

  let rentalDresses = await getFeaturedDresses('rental', 8)
  if (!rentalDresses || rentalDresses.length === 0) {
    rentalDresses = sampleDresses.filter((d) => d.category?.slug === 'rental')
  }

  const [featuredImages, latestCollectionItems] = await Promise.all([
    getFeaturedImages(),
    getLatestCollectionItems(),
  ])

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
