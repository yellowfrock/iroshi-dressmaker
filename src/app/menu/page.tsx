import type { Metadata } from 'next'
import { getPortfolioBackground } from '@/lib/supabase/queries'
import MenuClient from './MenuClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Menu | Iroshi Dressmaker',
  description: 'Mobile navigation menu for Iroshi Dressmaker.',
}

export default async function MenuPage() {
  const portfolioBg = await getPortfolioBackground()

  return <MenuClient initialBackground={portfolioBg} />
}
