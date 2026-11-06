'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FeaturedImage } from '@/types'

export default function AdminFeaturedImagesPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [images, setImages] = useState<FeaturedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)

  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Manual URLs state
  const [manualUrlsInput, setManualUrlsInput] = useState('')
  const [addingManualUrls, setAddingManualUrls] = useState(false)

  // Behance Import state
  const [behanceUrl, setBehanceUrl] = useState('')
  const [importingBehance, setImportingBehance] = useState(false)
  const [behanceImages, setBehanceImages] = useState<string[]>([])
  const [behanceProjectTitle, setBehanceProjectTitle] = useState('')
  const [selectedBehanceUrls, setSelectedBehanceUrls] = useState<string[]>([])
  const [savingBehanceImages, setSavingBehanceImages] = useState(false)

  // Load featured images from Supabase
  async function loadImages() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data, error } = await supabase
        .from('featured_images')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          setTableExists(false)
        } else {
          setErrorMessage(error.message)
        }
      } else {
        setTableExists(true)
        setImages((data as FeaturedImage[]) || [])
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load featured images.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  // 1. Direct file upload to Supabase Storage bucket 'dress-images'
  async function handleFileUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setUploading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const newItems: Partial<FeaturedImage>[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue

        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `featured-looks/${Date.now()}_${cleanFileName}`

        const { error: uploadErr } = await supabase.storage.from('dress-images').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

        if (uploadErr) {
          throw new Error(`Upload failed for "${file.name}": ${uploadErr.message}`)
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('dress-images').getPublicUrl(filePath)

        newItems.push({
          image_url: publicUrl,
          source: 'manual',
          is_active: true,
        })
      }

      if (newItems.length > 0) {
        const { data: inserted, error: insertErr } = await supabase
          .from('featured_images')
          .insert(newItems)
          .select()

        if (insertErr) {
          throw new Error(insertErr.message)
        }

        if (inserted) {
          setImages((prev) => [...(inserted as FeaturedImage[]), ...prev])
          setSuccessMessage(`Successfully uploaded and added ${inserted.length} image(s)!`)
          setTimeout(() => setSuccessMessage(null), 4000)
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Photo upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 2. Add multiple manual image URLs
  async function handleAddManualUrls(e: React.FormEvent) {
    e.preventDefault()
    const urls = manualUrlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    if (urls.length === 0) return

    setAddingManualUrls(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const newRows = urls.map((url) => ({
        image_url: url,
        source: 'manual',
        is_active: true,
      }))

      const { data: inserted, error } = await supabase.from('featured_images').insert(newRows).select()

      if (error) throw new Error(error.message)

      if (inserted) {
        setImages((prev) => [...(inserted as FeaturedImage[]), ...prev])
        setManualUrlsInput('')
        setSuccessMessage(`Added ${inserted.length} image URL(s) to featured looks!`)
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add image URLs.')
    } finally {
      setAddingManualUrls(false)
    }
  }

  // 3. Behance Project Import
  async function handleBehanceImport(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = behanceUrl.trim()
    if (!trimmed) return

    setImportingBehance(true)
    setErrorMessage(null)
    setBehanceImages([])
    setSelectedBehanceUrls([])

    try {
      const res = await fetch('/api/admin/behance-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to import from Behance.')
        return
      }

      setBehanceImages(data.images || [])
      setSelectedBehanceUrls(data.images || []) // Default select all
      setBehanceProjectTitle(data.projectTitle || 'Behance Project')
      setSuccessMessage(
        `Extracted ${data.images?.length || 0} image(s) from "${data.projectTitle || 'Behance Project'}". Choose which ones to add below.`
      )
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error importing Behance project.')
    } finally {
      setImportingBehance(false)
    }
  }

  // Toggle selection for extracted Behance image
  function toggleBehanceSelection(url: string) {
    setSelectedBehanceUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )
  }

  // Save selected Behance images to database
  async function handleSaveSelectedBehance() {
    if (selectedBehanceUrls.length === 0) return

    setSavingBehanceImages(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const newRows = selectedBehanceUrls.map((url) => ({
        image_url: url,
        source: 'behance',
        source_link: behanceUrl.trim(),
        is_active: true,
      }))

      const { data: inserted, error } = await supabase.from('featured_images').insert(newRows).select()

      if (error) throw new Error(error.message)

      if (inserted) {
        setImages((prev) => [...(inserted as FeaturedImage[]), ...prev])
        setSuccessMessage(`Successfully saved ${inserted.length} Behance image(s) to featured looks!`)
        setTimeout(() => setSuccessMessage(null), 4000)
        setBehanceImages([])
        setSelectedBehanceUrls([])
        setBehanceUrl('')
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save Behance images.')
    } finally {
      setSavingBehanceImages(false)
    }
  }

  // 4. Toggle active status
  async function handleToggleActive(item: FeaturedImage) {
    const updatedStatus = !item.is_active

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('featured_images')
        .update({ is_active: updatedStatus })
        .eq('id', item.id)

      if (error) throw new Error(error.message)

      setImages((prev) => prev.map((img) => (img.id === item.id ? { ...img, is_active: updatedStatus } : img)))
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating active state.')
    }
  }

  // 5. Delete image permanently
  async function handleDeleteImage(item: FeaturedImage) {
    if (!confirm('Are you sure you want to delete this featured image?')) return

    try {
      const supabase = createClient()

      // 1. Delete from database
      const { error: dbError } = await supabase.from('featured_images').delete().eq('id', item.id)
      if (dbError) throw new Error(dbError.message)

      // 2. If stored in Supabase storage, remove object
      if (item.image_url.includes('/storage/v1/object/public/dress-images/')) {
        const parts = item.image_url.split('/dress-images/')
        if (parts[1]) {
          supabase.storage.from('dress-images').remove([decodeURIComponent(parts[1])]).catch(() => {})
        }
      }

      setImages((prev) => prev.filter((img) => img.id !== item.id))
      setSuccessMessage('Featured look deleted successfully.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete image.')
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

  const activeCount = images.filter((img) => img.is_active).length

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
            Homepage Featured Looks
          </h1>
        </div>

        <Link
          href="/"
          target="_blank"
          className="text-xs font-mono text-[#F4D389] hover:text-white border border-[#F4D389]/40 hover:border-white px-4 py-2 rounded-full transition-colors no-underline"
        >
          View Live Hero ↗
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-white/10 font-mono text-xs">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
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
            className="px-4 py-2 rounded-full bg-white/10 text-white font-medium no-underline"
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

        {/* Intro & Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#F4D389] block mb-1">
              Hero Section Rotation Engine
            </span>
            <h2 className="font-serif italic text-2xl sm:text-3xl text-white font-medium">
              Featured Looks ({images.length})
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-light mt-1">
              On every homepage refresh, the 7 overlapping 3D cards randomly pick from your active images.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
              ● {activeCount} Active in Rotation
            </span>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-mono flex items-center justify-between"
          >
            <span>✅ {successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
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
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Setup Table Notice (if table hasn't been migrated yet) */}
        {!tableExists && (
          <div className="p-6 rounded-3xl bg-[#141005] border border-[#F4D389]/40 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-serif italic text-lg text-[#F4D389] font-medium">
                  Supabase Table Setup Required
                </h3>
                <p className="text-xs text-white/70">
                  Please run the <code className="text-[#F4D389]">003_featured_images.sql</code> script in your Supabase SQL Editor to activate live database synchronization.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://supabase.com/dashboard/project/nomdfldpzblimzdrccxl/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-5 rounded-full bg-[#F4D389] hover:bg-[#e0c076] text-black text-xs font-mono uppercase tracking-wider font-semibold transition-all no-underline"
              >
                Open Supabase SQL Editor ↗
              </a>
              <button
                type="button"
                onClick={loadImages}
                className="py-2 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all"
              >
                Refresh Status ↻
              </button>
            </div>
          </div>
        )}

        {/* Top Control Grid: Behance Import + Manual Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Behance Project Import */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl space-y-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                  Behance Sync
                </span>
                <h3 className="font-serif italic text-lg text-white font-medium">
                  Import from Behance Project
                </h3>
              </div>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Paste any Behance project link. We will extract all project photos so you can select and add them to your featured rotation.
              </p>
            </div>

            <form onSubmit={handleBehanceImport} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://www.behance.net/gallery/..."
                  value={behanceUrl}
                  onChange={(e) => setBehanceUrl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs font-mono focus:outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={importingBehance || !behanceUrl.trim()}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {importingBehance ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <span>Import Project</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] font-mono text-white/40">
                Supports public Behance editorial, lookbook &amp; couture portfolios.
              </p>
            </form>
          </div>

          {/* Card 2: Manual Direct Upload & Dropzone */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl space-y-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[#F4D389] font-mono text-[10px] uppercase font-bold tracking-wider">
                  Direct Upload
                </span>
                <h3 className="font-serif italic text-lg text-white font-medium">
                  Upload Photos from Device
                </h3>
              </div>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Upload image files directly to Supabase storage or paste image URLs below.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
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

              <div className="flex items-center justify-center gap-4">
                <span className="text-2xl text-[#F4D389]">📸</span>
                <div className="text-left">
                  <p className="text-xs font-medium text-white">
                    {uploading ? 'Uploading to storage...' : 'Drag & drop photos or browse files'}
                  </p>
                  <p className="text-[10px] text-white/40 font-mono">PNG, JPG, WEBP to dress-images bucket</p>
                </div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-auto px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Uploading...' : 'Browse'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Behance Extracted Preview Modal/Grid */}
        {behanceImages.length > 0 && (
          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-blue-500/30 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-blue-400 block mb-1">
                  Extracted Behance Gallery
                </span>
                <h3 className="font-serif italic text-2xl text-white font-medium">
                  {behanceProjectTitle} ({selectedBehanceUrls.length} of {behanceImages.length} selected)
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedBehanceUrls(
                      selectedBehanceUrls.length === behanceImages.length ? [] : [...behanceImages]
                    )
                  }
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/80 transition-all cursor-pointer"
                >
                  {selectedBehanceUrls.length === behanceImages.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  type="button"
                  disabled={savingBehanceImages || selectedBehanceUrls.length === 0}
                  onClick={handleSaveSelectedBehance}
                  className="px-6 py-2 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] disabled:opacity-40 cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  {savingBehanceImages ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Add Selected ({selectedBehanceUrls.length}) to Featured Looks</span>
                  )}
                </button>
              </div>
            </div>

            {/* Extracted Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {behanceImages.map((imgUrl, idx) => {
                const isSelected = selectedBehanceUrls.includes(imgUrl)
                return (
                  <div
                    key={idx}
                    onClick={() => toggleBehanceSelection(imgUrl)}
                    className={`relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-blue-400 ring-2 ring-blue-400/30 scale-[1.02]'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Behance item ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by card click
                        className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Manual Paste URLs Section (Accordion / Fold) */}
        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif italic text-base text-white font-medium">
              Or Paste Individual Image URLs (Fallback / External CDNs)
            </h3>
            <span className="font-mono text-[11px] text-white/40">One URL per line</span>
          </div>

          <form onSubmit={handleAddManualUrls} className="space-y-3">
            <textarea
              rows={3}
              placeholder="https://images.unsplash.com/...&#10;https://mir-s3-cdn-cf.behance.net/..."
              value={manualUrlsInput}
              onChange={(e) => setManualUrlsInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs font-mono focus:outline-none focus:border-[#F4D389] transition-colors leading-relaxed"
            />
            <button
              type="submit"
              disabled={addingManualUrls || !manualUrlsInput.trim()}
              className="px-6 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#e0c076] text-black text-xs font-mono uppercase tracking-wider font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {addingManualUrls ? 'Adding...' : '+ Add URLs to Rotation'}
            </button>
          </form>
        </div>

        {/* Section: All Featured Looks Gallery */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-serif italic text-xl text-white font-medium">
              All Featured Looks ({images.length})
            </h3>
            <span className="text-xs font-mono text-white/40">
              Active looks are chosen at random on each visit
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20 text-white/50 font-mono text-sm">
              <span className="animate-spin inline-block mr-2">⏳</span> Loading featured images...
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-3xl text-white/40 font-mono text-xs space-y-2">
              <p>📷 No featured images in the database yet.</p>
              <p className="text-white/30">The homepage currently displays the default fallback looks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {images.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl overflow-hidden border bg-white/5 aspect-[3/4] flex flex-col justify-between transition-all ${
                    item.is_active ? 'border-white/15 shadow-xl' : 'border-white/5 opacity-50'
                  }`}
                >
                  {/* Image Thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt="Featured look"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Badges */}
                  <div className="relative z-10 p-2.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider shadow ${
                        item.source === 'behance'
                          ? 'bg-blue-950/90 text-blue-300 border border-blue-500/40'
                          : 'bg-black/70 text-[#F4D389] border border-white/10'
                      }`}
                    >
                      {item.source}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(item)}
                      className="w-6 h-6 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                      title="Delete look"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Bottom Controls */}
                  <div className="relative z-10 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`text-[10px] font-mono px-2 py-1 rounded backdrop-blur-sm transition-colors cursor-pointer ${
                        item.is_active
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-black/60 text-white/50 border border-white/10 hover:text-white'
                      }`}
                      title="Click to toggle hero rotation inclusion"
                    >
                      {item.is_active ? '● Active' : '○ Inactive'}
                    </button>

                    {item.source_link && (
                      <a
                        href={item.source_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-white/60 hover:text-[#F4D389] ml-auto"
                        title="View Behance project"
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
