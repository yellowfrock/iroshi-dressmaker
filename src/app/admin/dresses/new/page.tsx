'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
}

interface ImageItem {
  id: string
  image_url: string
  storage_path: string
}

export default function NewDressPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [formData, setFormData] = useState({
    dress_code: '',
    name: '',
    category_id: '',
    description: '',
    availability: 'available',
    is_active: true,
  })

  // Images state
  const [images, setImages] = useState<ImageItem[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient()
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
    }
    loadCategories()
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Handle direct file uploads to Supabase Storage bucket 'dress-images'
  async function handleFileUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    try {
      const supabase = createClient()
      const folder = (formData.dress_code.trim() || 'unfiled').replace(/[^a-zA-Z0-9_-]/g, '_')
      const newItems: ImageItem[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          continue
        }

        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${folder}/${Date.now()}_${cleanFileName}`

        const { error: uploadErr } = await supabase.storage
          .from('dress-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadErr) {
          throw new Error(`Upload failed for "${file.name}": ${uploadErr.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('dress-images')
          .getPublicUrl(filePath)

        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          image_url: publicUrl,
          storage_path: filePath,
        })
      }

      setImages((prev) => [...prev, ...newItems])
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Add photo via direct URL
  function handleAddUrl(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = urlInput.trim()
    if (!trimmed) return

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      setUploadError('Please enter a valid image URL starting with https:// or http://')
      return
    }

    setImages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        image_url: trimmed,
        storage_path: 'external',
      },
    ])
    setUrlInput('')
    setUploadError(null)
  }

  function handleRemoveImage(index: number) {
    const item = images[index]
    if (item && item.storage_path !== 'external') {
      const supabase = createClient()
      supabase.storage.from('dress-images').remove([item.storage_path]).catch(() => {})
    }
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSetPrimary(index: number) {
    setImages((prev) => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      return next
    })
  }

  function handleMoveImage(from: number, to: number) {
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  // Drag-and-drop handlers for dropzone
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Insert dress row
      const { data: newDress, error: insertError } = await supabase
        .from('dresses')
        .insert([
          {
            dress_code: formData.dress_code.trim(),
            name: formData.name.trim(),
            category_id: formData.category_id || null,
            description: formData.description.trim(),
            availability: formData.availability,
            is_active: formData.is_active,
          },
        ])
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      // 2. Attach images to dress_images table
      if (images.length > 0 && newDress) {
        const rows = images.map((img, idx) => ({
          dress_id: newDress.id,
          image_url: img.image_url,
          storage_path: img.storage_path,
          image_order: idx,
        }))

        const { error: imgInsertError } = await supabase.from('dress_images').insert(rows)
        if (imgInsertError) {
          console.error('Failed to link some photos:', imgInsertError)
        }
      }

      setSuccess(true)
      setTimeout(() => router.push('/admin/dresses'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create dress')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white pb-24">
      {/* Top Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 px-6 sm:px-10 py-5 flex items-center justify-between select-none sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/90">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dresses"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors no-underline flex items-center gap-1.5"
          >
            ← Back to Catalog
          </Link>
          <span className="text-white/20">|</span>
          <h1 className="font-serif italic text-xl font-bold text-white tracking-wide">
            Add New Dress Silhouette
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
        {/* Intro */}
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-wider text-[#F4D389] block mb-1">
            Atelier Catalog Entry
          </span>
          <h2 className="font-serif italic text-2xl sm:text-3xl text-white font-medium">
            New Couture &amp; Rental Creation
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-light mt-1">
            Provide the silhouette details and upload lookbook photographs or external image URLs.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 mb-6 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono"
          >
            ❌ {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-4 mb-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-mono"
          >
            ✨ Dress created successfully with all photos attached! Redirecting to catalog...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Dress Details Card */}
          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl space-y-6">
            <h3 className="font-serif italic text-lg text-white font-medium border-b border-white/10 pb-3 flex items-center justify-between">
              <span>1. Silhouette Details</span>
              <span className="text-xs font-mono text-white/40 font-normal">Step 1 of 2</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dress Code */}
              <div>
                <label
                  htmlFor="dress_code"
                  className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
                >
                  Dress Code * <span className="text-[#F4D389]">(e.g. BR001 or RN001)</span>
                </label>
                <input
                  id="dress_code"
                  name="dress_code"
                  type="text"
                  required
                  value={formData.dress_code}
                  onChange={handleChange}
                  placeholder="e.g. BR005"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors"
                />
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
                >
                  Dress Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Golden Zari Silhouette"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label
                  htmlFor="category_id"
                  className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
                >
                  Collection Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-white/15 text-white text-sm focus:outline-none focus:border-[#F4D389] transition-colors cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability */}
              <div>
                <label
                  htmlFor="availability"
                  className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
                >
                  Availability Status
                </label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-white/15 text-white text-sm focus:outline-none focus:border-[#F4D389] transition-colors cursor-pointer"
                >
                  <option value="available">🟢 Available for Bookings / Fitting</option>
                  <option value="unavailable">🔴 Reserved / Currently Unavailable</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
              >
                Atelier Description &amp; Fabric Details
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Handcrafted lace bodice, silk organza skirt, tailored for reception..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors leading-relaxed"
              />
            </div>

            {/* Active Switch */}
            <div className="pt-2 flex items-center gap-3">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-[#D81B2B] cursor-pointer"
              />
              <label htmlFor="is_active" className="text-xs font-mono text-white/80 cursor-pointer">
                Publish publicly in collection catalog immediately
              </label>
            </div>
          </div>

          {/* Section 2: Photos & Imagery Card */}
          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif italic text-lg text-white font-medium flex items-center gap-2">
                  <span>2. Dress Photos &amp; Lookbook Imagery</span>
                </h3>
                <span className="text-xs font-mono text-[#F4D389]">
                  {images.length} photo{images.length === 1 ? '' : 's'} added
                </span>
              </div>
              <p className="text-xs text-white/50 font-light mt-1">
                Upload photos directly from your device or paste image URLs. The first photo will automatically serve as the primary cover image.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono">
                ⚠️ {uploadError}
              </div>
            )}

            {/* Dual Input: Dropzone + Direct URL Bar */}
            <div className="space-y-4">
              {/* File Upload Dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-[#F4D389] bg-[#F4D389]/5 scale-[1.01]'
                    : 'border-white/15 bg-white/[0.02] hover:border-white/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/avif"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-[#F4D389] shadow-inner">
                    {uploading ? (
                      <span className="animate-spin text-xl">⏳</span>
                    ) : (
                      <span>📸</span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {uploading
                        ? 'Uploading photos to dress-images storage...'
                        : 'Drag & drop photos here, or browse files'}
                    </p>
                    <p className="text-xs text-white/40 mt-1 font-mono">
                      PNG, JPG, WEBP, AVIF up to 10MB each
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {uploading ? 'Processing Upload...' : 'Choose Photos from Device'}
                  </button>
                </div>
              </div>

              {/* Divider: OR add by URL */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                  Or Add Via Image URL
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* URL Input Form */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste direct photo URL (e.g. https://images.unsplash.com/...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-xs font-mono focus:outline-none focus:border-[#F4D389] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim()}
                  className="px-6 py-3 rounded-xl bg-[#F4D389] hover:bg-[#e0c076] text-black text-xs font-mono uppercase tracking-wider font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  + Add URL
                </button>
              </div>
            </div>

            {/* Gallery Previews */}
            {images.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                    Uploaded Gallery Preview ({images.length})
                  </span>
                  <span className="text-[11px] font-mono text-white/40">
                    Use arrows to reorder • First photo is Primary Cover
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 aspect-[3/4] flex flex-col justify-between"
                    >
                      {/* Image Thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt={`Dress photo ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Badges */}
                      <div className="relative z-10 p-2.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                        {idx === 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#F4D389] text-black text-[10px] font-mono uppercase font-bold tracking-wider shadow">
                            ⭐ Primary Cover
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 text-[10px] font-mono">
                            #{idx + 1}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="w-6 h-6 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Bottom Controls */}
                      <div className="relative z-10 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="text-[10px] font-mono text-[#F4D389] hover:underline bg-black/50 px-2 py-1 rounded backdrop-blur-sm"
                          >
                            Set Primary
                          </button>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, idx - 1)}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white text-xs flex items-center justify-center"
                            title="Move earlier"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => handleMoveImage(idx, idx + 1)}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white text-xs flex items-center justify-center"
                            title="Move later"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Submit / Cancel Bar */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={loading || uploading}
              className="py-3.5 px-8 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Saving Dress &amp; Photos...</span>
                </>
              ) : (
                <span>Save &amp; Create Dress Piece</span>
              )}
            </button>
            <Link
              href="/admin/dresses"
              className="py-3.5 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all no-underline"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
