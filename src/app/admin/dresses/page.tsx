'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sampleDresses } from '@/lib/data/sample-dresses'

interface DressImageItem {
  id?: string
  image_url: string
  storage_path?: string
  image_order?: number
}

interface DressItem {
  id: string
  dress_code: string
  name: string
  category_id?: string | null
  description?: string | null
  availability: 'available' | 'unavailable'
  is_active: boolean
  created_at?: string
  category?: { name: string; slug: string } | null
  images?: DressImageItem[]
}

export default function AdminDressesPage() {
  const router = useRouter()
  const [dresses, setDresses] = useState<DressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('all')

  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState<DressItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load dresses from Supabase
  async function loadDresses() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: dbDresses, error } = await supabase
        .from('dresses')
        .select(`*, category:categories(name, slug), images:dress_images(id, image_url, storage_path, image_order)`)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(error.message)
      } else if (dbDresses && dbDresses.length > 0) {
        setDresses(dbDresses as DressItem[])
      } else {
        // Fallback to sample dresses if DB is empty
        setDresses(sampleDresses as unknown as DressItem[])
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load dresses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDresses()
  }, [])

  // Toggle active/public visibility in database
  async function handleToggleActive(dress: DressItem) {
    const updatedStatus = !dress.is_active
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('dresses')
        .update({ is_active: updatedStatus, updated_at: new Date().toISOString() })
        .eq('id', dress.id)

      if (error) {
        setErrorMessage(`Failed to update status: ${error.message}`)
        return
      }

      setDresses((prev) =>
        prev.map((d) => (d.id === dress.id ? { ...d, is_active: updatedStatus } : d))
      )
      setSuccessMessage(
        `Dress ${dress.dress_code} is now ${updatedStatus ? 'visible publicly' : 'hidden from public catalogue'}.`
      )
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating status')
    }
  }

  // Delete dress permanently from database and Supabase storage
  async function confirmDeleteDress() {
    if (!itemToDelete) return
    setDeleting(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()

      // 1. Clean up any stored files in Supabase 'dress-images' bucket
      if (itemToDelete.images && itemToDelete.images.length > 0) {
        const storagePaths = itemToDelete.images
          .map((img) => img.storage_path)
          .filter((p): p is string => Boolean(p && p !== 'external'))

        if (storagePaths.length > 0) {
          await supabase.storage.from('dress-images').remove(storagePaths).catch(() => {})
        }
      }

      // 2. Delete dress row from Supabase database
      // (ON DELETE CASCADE in schema automatically removes linked dress_images rows)
      const { error: delError } = await supabase
        .from('dresses')
        .delete()
        .eq('id', itemToDelete.id)

      if (delError) {
        throw new Error(delError.message)
      }

      // 3. Remove from UI state
      setDresses((prev) => prev.filter((d) => d.id !== itemToDelete.id))
      setSuccessMessage(
        `Dress "${itemToDelete.dress_code} - ${itemToDelete.name}" was permanently deleted from the database.`
      )
      setTimeout(() => setSuccessMessage(null), 4000)
      setItemToDelete(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete dress from database.')
    } finally {
      setDeleting(false)
    }
  }

  // Filter dresses by search query and availability
  const filteredDresses = dresses.filter((dress) => {
    const matchesSearch =
      dress.dress_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dress.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dress.category?.name && dress.category.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesAvailability =
      filterAvailability === 'all' || dress.availability === filterAvailability

    return matchesSearch && matchesAvailability
  })

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white pb-24">
      {/* Admin Monograph Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 px-6 sm:px-10 py-5 flex justify-between items-center select-none sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/90">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors no-underline flex items-center gap-1.5"
          >
            ← Dashboard
          </Link>
          <span className="text-white/20">|</span>
          <h1 className="font-serif italic text-xl font-bold text-white tracking-wide">
            Manage Catalog
          </h1>
        </div>

        <Link
          href="/admin/dresses/new"
          className="py-2.5 px-5 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] no-underline active:scale-95 flex items-center gap-2"
        >
          <span>+ Add Dress</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#F4D389] block mb-1">
              Active Inventory
            </span>
            <h2 className="font-serif italic text-2xl sm:text-3xl text-white font-medium">
              Catalog Items ({filteredDresses.length}
              {filteredDresses.length !== dresses.length && ` of ${dresses.length}`})
            </h2>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search code, name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs font-mono focus:outline-none focus:border-[#F4D389] transition-colors w-64"
            />

            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value as 'all' | 'available' | 'unavailable')}
              className="px-3 py-2 rounded-xl bg-[#141414] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#F4D389] transition-colors cursor-pointer"
            >
              <option value="all">All Availability</option>
              <option value="available">🟢 Available</option>
              <option value="unavailable">🔴 Reserved</option>
            </select>
          </div>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-mono flex items-center justify-between"
          >
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono flex items-center justify-between"
          >
            <span>❌ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-white/50 font-mono text-sm">
            <span className="animate-spin inline-block mr-2">⏳</span> Loading catalog inventory from database...
          </div>
        ) : filteredDresses.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-[#0a0a0a] text-white/50 font-mono text-sm space-y-4">
            <p>No dresses found matching your search or filters.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#F4D389] hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          /* Dress Table Container */
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] font-mono text-[11px] uppercase tracking-wider text-white/50">
                  <th className="py-4 px-6">Photo</th>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Dress Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Availability</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredDresses.map((dress) => {
                  const isAvail = dress.availability === 'available'
                  const sortedImages = dress.images
                    ? [...dress.images].sort((a, b) => (a.image_order ?? 0) - (b.image_order ?? 0))
                    : []
                  const primaryPhoto = sortedImages[0]?.image_url

                  return (
                    <tr key={dress.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-6">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                          {primaryPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={primaryPhoto}
                              alt={dress.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white/20 text-xs">📷</span>
                          )}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-4 px-6 font-mono text-xs text-[#F4D389] font-medium whitespace-nowrap">
                        {dress.dress_code}
                      </td>

                      {/* Dress Name & Public Link */}
                      <td className="py-4 px-6 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dress/${dress.dress_code}`}
                            target="_blank"
                            className="hover:text-[#F4D389] transition-colors no-underline line-clamp-1"
                            title="Preview public page"
                          >
                            {dress.name}
                          </Link>
                          <Link
                            href={`/dress/${dress.dress_code}`}
                            target="_blank"
                            className="text-white/30 hover:text-[#F4D389] text-xs no-underline"
                            title="Open public page"
                          >
                            ↗
                          </Link>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 text-xs text-white/60 font-mono whitespace-nowrap">
                        {dress.category?.name ?? 'Bespoke'}
                      </td>

                      {/* Availability */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase ${
                            isAvail
                              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                              : 'bg-red-950/80 border border-red-500/40 text-red-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAvail ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          <span>{isAvail ? 'Available' : 'Reserved'}</span>
                        </span>
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(dress)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                            dress.is_active
                              ? 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                              : 'bg-white/[0.02] border-white/10 text-white/40 hover:text-white/70'
                          }`}
                          title="Click to toggle public visibility"
                        >
                          {dress.is_active ? '● Public' : '○ Hidden'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/dresses/${dress.id}`}
                            className="font-mono text-xs text-[#F4D389] hover:underline"
                          >
                            Edit →
                          </Link>

                          <span className="text-white/20">|</span>

                          <button
                            type="button"
                            onClick={() => setItemToDelete(dress)}
                            className="font-mono text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer transition-colors"
                            title="Delete dress from database"
                          >
                            Delete 🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Confirmation Modal for Permanent Database Deletion */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f0f0f] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(216,27,43,0.25)] space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center text-2xl flex-shrink-0">
                ⚠️
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-red-400 font-semibold block">
                  Permanent Database Deletion
                </span>
                <h3 className="font-serif italic text-xl text-white font-medium">
                  Delete &ldquo;{itemToDelete.name}&rdquo;?
                </h3>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-sans">
              Are you sure you want to permanently delete dress{' '}
              <strong className="text-[#F4D389] font-mono">{itemToDelete.dress_code}</strong> from the
              catalogue?
            </p>

            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-[11px] font-mono text-red-300 space-y-1">
              <p>• The dress row will be deleted from the database table &quot;dresses&quot;.</p>
              <p>• All linked photo records in &quot;dress_images&quot; will be deleted automatically.</p>
              <p>• This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
                className="py-2.5 px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteDress}
                className="py-2.5 px-6 rounded-full bg-[#D81B2B] hover:bg-[#b01321] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.4)] disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95"
              >
                {deleting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Deleting from DB...</span>
                  </>
                ) : (
                  <span>Yes, Delete from Database</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
