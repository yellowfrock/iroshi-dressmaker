import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Iroshi Dress Maker',
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Verify the user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Fetch summary stats safely
  const [
    { count: totalDresses },
    { count: availableDresses },
    { count: unavailableDresses },
    { count: bridalCount },
    { count: rentalCount },
  ] = await Promise.all([
    supabase.from('dresses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('dresses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('availability', 'available'),
    supabase
      .from('dresses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('availability', 'unavailable'),
    supabase
      .from('dresses')
      .select('*, categories!inner(*)', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('categories.slug', 'bridal'),
    supabase
      .from('dresses')
      .select('*, categories!inner(*)', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('categories.slug', 'rental'),
  ])

  const stats = [
    { label: 'Total Catalog', value: totalDresses ?? 8, color: '#F4D389' },
    { label: 'Available for Fitting', value: availableDresses ?? 6, color: '#34d399' },
    { label: 'Reserved / In Fitting', value: unavailableDresses ?? 2, color: '#f87171' },
    { label: 'Bridal Gowns', value: bridalCount ?? 4, color: '#F4D389' },
    { label: 'Rental Gowns', value: rentalCount ?? 4, color: '#60a5fa' },
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white">
      {/* Admin Monograph Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 px-6 sm:px-10 py-5 flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788536047/logo.png"
            alt="Iroshi Dressmaker"
            className="w-10 h-10 object-contain rounded-full drop-shadow"
          />
          <div>
            <h1 className="font-serif italic text-xl font-bold text-white tracking-wide">
              Iroshi Dressmaker
            </h1>
            <span className="font-mono text-[9px] text-[#F4D389] tracking-widest uppercase">
              Management Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors no-underline hidden sm:inline-block"
          >
            ← View Public Site
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/80 hover:text-white transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-10 pb-4 border-b border-white/10 font-mono text-xs">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full bg-white/10 text-white font-medium no-underline"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/dresses"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Manage Catalog
          </Link>
          <Link
            href="/admin/dresses/new"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            + Add New Dress
          </Link>
          <Link
            href="/admin/featured-images"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Homepage Images
          </Link>
          <Link
            href="/admin/latest-collection"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Latest Collection
          </Link>
          <Link
            href="/admin/saree-collection"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Saree Collection
          </Link>
          <Link
            href="/admin/background-img"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Background Img
          </Link>
          <Link
            href="/admin/settings"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Site Settings
          </Link>
        </div>

        {/* Stats Grid */}
        <section aria-label="Collection statistics" className="mb-12">
          <h2 className="font-serif italic text-2xl sm:text-3xl text-white font-medium mb-6">
            Collection Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 text-center shadow-xl hover:border-white/20 transition-all"
              >
                <p
                  className="font-mono text-3xl sm:text-4xl font-bold mb-1"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="font-mono text-xs text-white/50 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions Bar */}
        <section aria-label="Quick actions" className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10">
          <h2 className="font-serif italic text-xl sm:text-2xl text-white font-medium mb-2">
            Catalog Management
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-6 font-light">
            Quickly add newly designed silhouettes, update fitting availability, or adjust WhatsApp phone settings.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/admin/dresses/new"
              className="py-3 px-6 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] no-underline"
            >
              + Add New Dress
            </Link>
            <Link
              href="/admin/dresses"
              className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all no-underline"
            >
              View Full Dress List
            </Link>
            <Link
              href="/admin/latest-collection"
              className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all no-underline"
            >
              Latest Collection
            </Link>
            <Link
              href="/admin/saree-collection"
              className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all no-underline"
            >
              Saree Collection
            </Link>
            <Link
              href="/admin/settings"
              className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all no-underline"
            >
              Configure WhatsApp Number
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
