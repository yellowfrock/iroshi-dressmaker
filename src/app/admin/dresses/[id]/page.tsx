'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Category, DressAvailability } from '@/types'

interface DressImageData {
  id: string
  image_url: string
  storage_path: string
  image_order: number
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditDressPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const dressId = resolvedParams.id
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    dress_code: '',
    name: '',
    category_id: '',
    description: '',
    availability: 'available' as DressAvailability,
    is_active: true,
  })

  // Images state
  const [images, setImages] = useState<DressImageData[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Danger zone delete dress state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingDress, setDeletingDress] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()

        // Load categories
        const { data: catData } = await supabase.from('categories').select('*').order('name')
        if (catData) setCategories(catData)

        // Load dress details & related images
        const { data: dressData, error: dressError } = await supabase
          .from('dresses')
          .select('*, dress_images(id, image_url, storage_path, image_order)')
          .eq('id', dressId)
          .single()

        if (dressError || !dressData) {
          setError(dressError?.message || 'Dress not found')
          setLoading(false)
          return
        }

        setFormData({
          dress_code: dressData.dress_code,
          name: dressData.name,
          category_id: dressData.category_id || '',
          description: dressData.description || '',
          availability: dressData.availability as DressAvailability,
          is_active: dressData.is_active,
        })

        if (dressData.dress_images) {
          const sorted = [...dressData.dress_images].sort(
            (a: DressImageData, b: DressImageData) => a.image_order - b.image_order
          )
          setImages(sorted)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load dress details')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dressId])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSaveDress(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('dresses')
        .update({
          dress_code: formData.dress_code.trim(),
          name: formData.name.trim(),
          category_id: formData.category_id || null,
          description: formData.description.trim(),
          availability: formData.availability,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dressId)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating dress')
    } finally {
      setSaving(false)
    }
  }

  // Handle direct file uploads from device to Supabase Storage bucket 'dress-images'
  async function handleFileUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setUploadingImage(true)
    setUploadError(null)

    try {
      const supabase = createClient()
      const folder = (formData.dress_code.trim() || dressId).replace(/[^a-zA-Z0-9_-]/g, '_')
      let currentMaxOrder = images.length > 0 ? Math.max(...images.map((img) => img.image_order)) : -1

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue

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

        currentMaxOrder += 1

        // Insert row directly into dress_images
        const { data: newImgRow, error: insertImgErr } = await supabase
          .from('dress_images')
          .insert([
            {
              dress_id: dressId,
              image_url: publicUrl,
              storage_path: filePath,
              image_order: currentMaxOrder,
            },
          ])
          .select()
          .single()

        if (insertImgErr) {
          throw new Error(`Failed to save image record: ${insertImgErr.message}`)
        }

        if (newImgRow) {
          setImages((prev) => [...prev, newImgRow])
        }
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Photo upload failed.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Add photo via direct URL
  async function handleAddImageByUrl(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = urlInput.trim()
    if (!trimmed) return

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      setUploadError('Please enter a valid image URL starting with https:// or http://')
      return
    }

    setUploadingImage(true)
    setUploadError(null)

    try {
      const supabase = createClient()
      const nextOrder = images.length > 0 ? Math.max(...images.map((img) => img.image_order)) + 1 : 0

      const { data, error: imgError } = await supabase
        .from('dress_images')
        .insert([
          {
            dress_id: dressId,
            image_url: trimmed,
            storage_path: 'external',
            image_order: nextOrder,
          },
        ])
        .select()
        .single()

      if (imgError) {
        setUploadError(imgError.message)
      } else if (data) {
        setImages((prev) => [...prev, data])
        setUrlInput('')
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to add image')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleDeleteImage(image: DressImageData) {
    if (!confirm('Are you sure you want to remove this photo?')) return

    try {
      const supabase = createClient()

      // Remove from DB
      const { error: delError } = await supabase.from('dress_images').delete().eq('id', image.id)
      if (delError) {
        setUploadError(delError.message)
        return
      }

      // If stored in Supabase storage, remove file
      if (image.storage_path && image.storage_path !== 'external') {
        supabase.storage.from('dress-images').remove([image.storage_path]).catch(() => {})
      }

      setImages((prev) => prev.filter((img) => img.id !== image.id))
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete image')
    }
  }

  // Delete this dress permanently from database
  async function handleDeleteDressPermanently() {
    setDeletingDress(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Remove photos from Supabase Storage if stored in bucket
      if (images && images.length > 0) {
        const storagePaths = images
          .map((img) => img.storage_path)
          .filter((p): p is string => Boolean(p && p !== 'external'))

        if (storagePaths.length > 0) {
          await supabase.storage.from('dress-images').remove(storagePaths).catch(() => {})
        }
      }

      // 2. Delete dress from DB (cascade removes dress_images rows)
      const { error: delError } = await supabase.from('dresses').delete().eq('id', dressId)

      if (delError) {
        throw new Error(delError.message)
      }

      // 3. Redirect back to catalog
      router.push('/admin/dresses')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete dress.')
      setDeletingDress(false)
      setShowDeleteModal(false)
    }
  }

  async function handleSetPrimary(index: number) {
    const updated = [...images]
    const [selected] = updated.splice(index, 1)
    updated.unshift(selected)

    setImages(updated)

    // Update order in Supabase
    try {
      const supabase = createClient()
      for (let i = 0; i < updated.length; i++) {
        await supabase.from('dress_images').update({ image_order: i }).eq('id', updated[i].id)
      }
    } catch (err) {
      console.error('Failed to sync reorder:', err)
    }
  }

  async function handleMoveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return
    const updated = [...images]
    const [selected] = updated.splice(from, 1)
    updated.splice(to, 0, selected)

    setImages(updated)

    // Update order in Supabase
    try {
      const supabase = createClient()
      for (let i = 0; i < updated.length; i++) {
        await supabase.from('dress_images').update({ image_order: i }).eq('id', updated[i].id)
      }
    } catch (err) {
      console.error('Failed to sync reorder:', err)
    }
  }

  // Drag-and-drop
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/60 font-mono text-sm">
        <span className="animate-spin mr-2">⏳</span> Loading dress details...
      </div>
    )
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
            Edit Dress: <span className="text-[#F4D389]">{formData.dress_code || 'Dress'}</span>
          </h1>
        </div>

        <Link
          href={`/dress/${formData.dress_code}`}
          target="_blank"
          className="text-xs font-mono text-[#F4D389] hover:text-white border border-[#F4D389]/40 hover:border-white px-4 py-2 rounded-full transition-colors no-underline"
        >
          View Public Page ↗
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-10 space-y-8">
        {/* Intro */}
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#F4D389] block mb-1">
            Piece Management
          </span>
          <h2 className="font-serif italic text-2xl sm:text-3xl text-white font-medium">
            {formData.name || 'Dress Details'}
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-light mt-1">
            Update silhouette details, availability status, and manage gallery lookbook photographs.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono"
          >
            ❌ {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-mono"
          >
            ✅ Changes saved successfully!
          </div>
        )}

        {/* Section 1: Dress Details Form */}
        <form
          onSubmit={handleSaveDress}
          className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl space-y-6"
        >
          <h3 className="font-serif italic text-lg text-white font-medium border-b border-white/10 pb-3 flex items-center justify-between">
            <span>Silhouette Information</span>
            <span className="text-xs font-mono text-white/40 font-normal">Base Attributes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dress Code */}
            <div>
              <label
                htmlFor="dress_code"
                className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
              >
                Dress Code *
              </label>
              <input
                id="dress_code"
                name="dress_code"
                type="text"
                required
                value={formData.dress_code}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category_id"
                className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
              >
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-white/15 text-white text-sm focus:outline-none focus:border-[#F4D389] transition-colors cursor-pointer"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
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
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-[#F4D389] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
            >
              Description &amp; Fabric Notes
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Fabric details, silhouette, embroidery, neckline, suitable occasions..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors leading-relaxed"
            />
          </div>

          {/* Availability & Public Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
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
                <option value="available">🟢 Available for Bookings / Rental</option>
                <option value="unavailable">🔴 Reserved / Currently Unavailable</option>
              </select>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-[#D81B2B] cursor-pointer"
                />
                <span className="text-xs font-mono text-white/90">Active on Public Website</span>
              </label>
              <p className="text-[11px] font-mono text-white/40 mt-1">
                Unchecking hides this dress from the public catalog.
              </p>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
            <Link
              href="/admin/dresses"
              className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all no-underline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-8 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Section 2: Photos & Gallery Section */}
        <section className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif italic text-lg text-white font-medium">
                Dress Photos &amp; Lookbook Gallery
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                The first photo (order #1) is used as the cover / primary thumbnail in the collection catalog.
              </p>
            </div>
            <span className="text-xs font-mono text-[#F4D389]">
              {images.length} photo{images.length === 1 ? '' : 's'}
            </span>
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono">
              ⚠️ {uploadError}
            </div>
          )}

          {/* Dual Upload: File Dropzone + URL Input */}
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
                  {uploadingImage ? (
                    <span className="animate-spin text-xl">⏳</span>
                  ) : (
                    <span>📸</span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    {uploadingImage
                      ? 'Uploading to dress-images storage & saving...'
                      : 'Drag & drop photos here, or browse files'}
                  </p>
                  <p className="text-xs text-white/40 mt-1 font-mono">
                    Direct upload to dress-images bucket (PNG, JPG, WEBP)
                  </p>
                </div>

                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {uploadingImage ? 'Processing Upload...' : 'Choose Photos from Device'}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                Or Add Via Image URL
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Add Image URL Form */}
            <form onSubmit={handleAddImageByUrl} className="flex gap-2">
              <input
                type="url"
                placeholder="Paste photo URL (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-xs font-mono focus:outline-none focus:border-[#F4D389] transition-colors"
              />
              <button
                type="submit"
                disabled={uploadingImage || !urlInput.trim()}
                className="px-6 py-3 rounded-xl bg-[#F4D389] hover:bg-[#e0c076] text-black text-xs font-mono uppercase tracking-wider font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploadingImage ? 'Adding...' : '+ Add Photo'}
              </button>
            </form>
          </div>

          {/* Image Grid */}
          {images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl text-white/40 font-mono text-xs">
              📷 No photos added yet. Upload files or paste photo URLs above.
            </div>
          ) : (
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                  Current Photos ({images.length})
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  First photo is Primary Cover • Changes save automatically
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 aspect-[3/4] flex flex-col justify-between"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={`Photo ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Badge & Delete */}
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
                        onClick={() => handleDeleteImage(img)}
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
        </section>

        {/* Danger Zone: Permanent Deletion */}
        <section className="p-8 rounded-3xl bg-red-950/20 border border-red-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif italic text-lg text-red-300 font-medium flex items-center gap-2">
                <span>⚠️ Danger Zone</span>
              </h3>
              <p className="text-xs text-red-200/60 mt-1">
                Permanently delete this dress piece and its photos from the database and public catalogue.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="py-2.5 px-6 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-lg cursor-pointer self-start sm:self-auto active:scale-95"
            >
              Delete Dress Piece
            </button>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {showDeleteModal && (
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
                  Delete &ldquo;{formData.name}&rdquo;?
                </h3>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-sans">
              Are you sure you want to permanently delete dress{' '}
              <strong className="text-[#F4D389] font-mono">{formData.dress_code}</strong> from the
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
                disabled={deletingDress}
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingDress}
                onClick={handleDeleteDressPermanently}
                className="py-2.5 px-6 rounded-full bg-[#D81B2B] hover:bg-[#b01321] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.4)] disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95"
              >
                {deletingDress ? (
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
