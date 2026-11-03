import type { Metadata } from 'next'
import CollectionManager from '@/components/admin/CollectionManager'

export const metadata: Metadata = {
  title: 'Saree Collection Manager | Admin | Iroshi Dressmaker',
  robots: { index: false, follow: false },
}

export default function AdminSareeCollectionPage() {
  return (
    <CollectionManager
      type="saree"
      title="Saree Collection"
      subtitle="Manage, upload, and reorder the bridal sarees, pure silk drapes, and curated commissions displayed on the portfolio showcase."
    />
  )
}
