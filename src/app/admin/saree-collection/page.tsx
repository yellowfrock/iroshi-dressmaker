import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SareeCollectionAdmin from '@/components/admin/SareeCollectionAdmin'

export const metadata: Metadata = {
  title: 'Saree Collection Manager | Admin | Iroshi Dressmaker',
  robots: { index: false, follow: false },
}

export default async function AdminSareeCollectionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  return <SareeCollectionAdmin />
}
