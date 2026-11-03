import type { Metadata } from 'next'
import CollectionManager from '@/components/admin/CollectionManager'

export const metadata: Metadata = {
  title: 'Latest Collection Manager | Admin | Iroshi Dressmaker',
  robots: { index: false, follow: false },
}

export default function AdminLatestCollectionPage() {
  return (
    <CollectionManager
      type="latest"
      title="Latest Collection"
      subtitle="Manage, upload, and reorder the bespoke garments and haute-couture silhouettes displayed on the homepage showcase."
    />
  )
}
