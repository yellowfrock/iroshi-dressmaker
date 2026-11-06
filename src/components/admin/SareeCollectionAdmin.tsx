'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Upload,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Loader2,
  RefreshCw,
  ImageIcon,
  RotateCcw,
  ImageOff,
  Images,
} from 'lucide-react'
import type { CollectionItem } from '@/types'
import {
  getAdminCollectionItems,
  createCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  togglePublishCollectionItem,
  reorderCollectionItems,
  uploadCollectionImageAction,
  removeCollectionItemImage,
} from '@/app/admin/actions/collections'
import { SAREE_GALLERY_IMAGES } from '@/config/saree-gallery'

/**
 * Client-side canvas image compressor to optimize images before upload.
 * Reduces 5MB+ photos down to high-fidelity ~250-500KB JPEG/PNG.
 */
async function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file)
              return
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, outputType === 'image/png' ? '.png' : '.jpg')
            const compressed = new File([blob], cleanName, {
              type: outputType,
              lastModified: Date.now(),
            })
            resolve(compressed)
          },
          outputType,
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export default function SareeCollectionAdmin() {
  const [items, setItems] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Add / Edit Saree Modal state (supports 2 images: front view & detail view)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CollectionItem | null>(null)
  const [cardTitle, setCardTitle] = useState('')
  const [cardBadge, setCardBadge] = useState('')
  const [cardSareeCode, setCardSareeCode] = useState('')
  const [cardDescription, setCardDescription] = useState('')
  const [cardIsPublished, setCardIsPublished] = useState(true)

  // Image 1 state (Front / Main View — Required)
  const [image1File, setImage1File] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image1Url, setImage1Url] = useState('')
  const [image1Path, setImage1Path] = useState<string | null>(null)
  const [isDragging1, setIsDragging1] = useState(false)
  const [showUrlInput1, setShowUrlInput1] = useState(false)
  const fileInputRef1 = useRef<HTMLInputElement>(null)

  // Image 2 state (Detail / Pallu View — Optional)
  const [image2File, setImage2File] = useState<File | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [image2Url, setImage2Url] = useState('')
  const [image2Path, setImage2Path] = useState<string | null>(null)
  const [isDragging2, setIsDragging2] = useState(false)
  const [showUrlInput2, setShowUrlInput2] = useState(false)
  const fileInputRef2 = useRef<HTMLInputElement>(null)

  const [savingCard, setSavingCard] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // Delete Card Confirmation state
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (message: string, toastType: 'success' | 'error' = 'success') => {
    setToast({ message, type: toastType })
  }

  // Load items from database
  const loadItems = async () => {
    try {
      setError(null)
      const data = await getAdminCollectionItems('saree')
      setItems(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load saree collection items.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  // Helper to format saree code
  const getSareeCode = (item: CollectionItem, index: number) => {
    return item.saree_code || `SR-${String(index + 1).padStart(3, '0')}`
  }

  // Resolve images for display on card
  const getItemImages = (item: CollectionItem, code: string): string[] => {
    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images.filter(Boolean)
    }
    const pair = [item.image_url, item.detail_url].filter(Boolean) as string[]
    if (pair.length > 0) return pair
    return SAREE_GALLERY_IMAGES[code] || []
  }

  // -------------------------------------------------------------------------
  // FILE SELECTION & VALIDATION HANDLERS
  // -------------------------------------------------------------------------
  const handleValidateAndSelectFile = async (file: File, slot: 1 | 2) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name)
    if (!isImage) {
      showToast(`Invalid format for Image ${slot}. Please choose a JPG, PNG, or WEBP file.`, 'error')
      return
    }

    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      showToast(
        `Image ${slot} is ${(file.size / (1024 * 1024)).toFixed(1)}MB, exceeding the 5MB limit. Please pick a smaller image.`,
        'error'
      )
      return
    }

    try {
      const compressed = await compressImage(file)
      const preview = URL.createObjectURL(compressed)
      if (slot === 1) {
        setImage1File(compressed)
        setImage1Preview(preview)
      } else {
        setImage2File(compressed)
        setImage2Preview(preview)
      }
    } catch {
      const preview = URL.createObjectURL(file)
      if (slot === 1) {
        setImage1File(file)
        setImage1Preview(preview)
      } else {
        setImage2File(file)
        setImage2Preview(preview)
      }
    }
  }

  // -------------------------------------------------------------------------
  // CARD DETAILS ADD / EDIT MODAL OPEN
  // -------------------------------------------------------------------------
  const handleOpenCreateCard = () => {
    setEditingCard(null)
    setCardTitle('')
    setCardBadge('')
    setCardSareeCode(`SR-${String(items.length + 1).padStart(3, '0')}`)
    setCardDescription('')
    setCardIsPublished(true)

    // Image 1 clear
    setImage1File(null)
    setImage1Preview(null)
    setImage1Url('')
    setImage1Path(null)
    setShowUrlInput1(false)

    // Image 2 clear
    setImage2File(null)
    setImage2Preview(null)
    setImage2Url('')
    setImage2Path(null)
    setShowUrlInput2(false)

    setUploadProgress(null)
    setIsCardModalOpen(true)
  }

  const handleOpenEditCard = (item: CollectionItem, code: string) => {
    setEditingCard(item)
    setCardTitle(item.title)
    setCardBadge(item.subtitle_badge || '')
    setCardSareeCode(item.saree_code || code)
    setCardDescription(item.description || '')
    setCardIsPublished(item.is_published)

    const existingImages = getItemImages(item, code)

    // Preload Image 1
    const img1 = existingImages[0] || item.image_url || ''
    setImage1Url(img1)
    setImage1Preview(img1 || null)
    setImage1Path(item.image_path || null)
    setImage1File(null)
    setShowUrlInput1(false)

    // Preload Image 2
    const img2 = existingImages[1] || item.detail_url || ''
    setImage2Url(img2)
    setImage2Preview(img2 || null)
    setImage2Path(null)
    setImage2File(null)
    setShowUrlInput2(false)

    setUploadProgress(null)
    setIsCardModalOpen(true)
  }

  // -------------------------------------------------------------------------
  // SAVE / POST / UPDATE CARD HANDLER
  // -------------------------------------------------------------------------
  const handleSaveCardDetails = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardTitle.trim()) {
      showToast('Please provide a title for the saree.', 'error')
      return
    }

    // Validate Image 1 (Required)
    const hasImage1 = !!image1File || !!image1Url.trim()
    if (!hasImage1) {
      showToast('Image 1 (Front View) is required. Please upload or provide a photo.', 'error')
      return
    }

    setSavingCard(true)
    setUploadProgress(15)

    try {
      let finalUrl1 = image1Url.trim()
      let finalPath1 = image1Path

      let finalUrl2 = image2Url.trim()
      let finalPath2 = image2Path

      // 1. Upload Image 1 if a new file was chosen
      if (image1File) {
        setUploadProgress(30)
        const fd = new FormData()
        fd.append('file', image1File)
        fd.append('folder', 'saree')
        const res1 = await uploadCollectionImageAction(fd)
        finalUrl1 = res1.publicUrl
        finalPath1 = res1.imagePath
        setUploadProgress(60)
      }

      // 2. Upload Image 2 if a new file was chosen
      if (image2File) {
        setUploadProgress(70)
        const fd = new FormData()
        fd.append('file', image2File)
        fd.append('folder', 'saree')
        const res2 = await uploadCollectionImageAction(fd)
        finalUrl2 = res2.publicUrl
        finalPath2 = res2.imagePath
        setUploadProgress(85)
      }

      const finalImages: string[] = []
      if (finalUrl1) finalImages.push(finalUrl1)
      if (finalUrl2) finalImages.push(finalUrl2)

      if (editingCard) {
        const updated = await updateCollectionItem('saree', editingCard.id, {
          title: cardTitle,
          subtitle_badge: cardBadge,
          saree_code: cardSareeCode.trim() || null,
          description: cardDescription,
          image_url: finalUrl1,
          image_path: finalPath1,
          detail_url: finalUrl2 || null,
          images: finalImages,
          is_published: cardIsPublished,
        })
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
        showToast(`"${updated.title}" updated successfully with ${finalImages.length} image(s)!`)
      } else {
        const created = await createCollectionItem('saree', {
          title: cardTitle,
          subtitle_badge: cardBadge,
          saree_code: cardSareeCode.trim() || null,
          description: cardDescription,
          image_url: finalUrl1,
          image_path: finalPath1,
          detail_url: finalUrl2 || null,
          images: finalImages,
          is_published: cardIsPublished,
          sort_order: items.length + 1,
        })
        setItems((prev) => [...prev, created])
        showToast(`"${created.title}" added to Saree Collection with ${finalImages.length} image(s)!`)
      }

      setUploadProgress(100)
      setIsCardModalOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save saree.'
      showToast(msg, 'error')
    } finally {
      setSavingCard(false)
      setUploadProgress(null)
    }
  }

  // -------------------------------------------------------------------------
  // TOGGLE PUBLISH & REORDER HANDLERS
  // -------------------------------------------------------------------------
  const handleTogglePublish = async (item: CollectionItem) => {
    const nextState = !item.is_published
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_published: nextState } : it)))

    try {
      await togglePublishCollectionItem('saree', item.id, nextState)
      showToast(`${item.title} is now ${nextState ? 'published' : 'hidden'}.`)
    } catch (err) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_published: !nextState } : it)))
      const msg = err instanceof Error ? err.message : 'Failed to update visibility.'
      showToast(msg, 'error')
    }
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const reordered = [...items]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    setItems(reordered)

    try {
      await reorderCollectionItems('saree', reordered.map((it) => it.id))
      showToast('Order updated successfully.')
    } catch (err) {
      setItems(items)
      const msg = err instanceof Error ? err.message : 'Failed to update order.'
      showToast(msg, 'error')
    }
  }

  // -------------------------------------------------------------------------
  // DELETE CARD HANDLERS
  // -------------------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      await deleteCollectionItem('saree', deleteTarget.id)
      setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id))
      showToast(`"${deleteTarget.title}" deleted from collection.`)
      setDeleteTarget(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete saree.'
      showToast(msg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl text-xs font-mono tracking-wider shadow-2xl flex items-center gap-3 backdrop-blur-md border animate-fade-in ${
            toast.type === 'success'
              ? 'bg-[#F4D389]/15 text-[#F4D389] border-[#F4D389]/40'
              : 'bg-red-500/15 text-red-400 border-red-500/40'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4D389]/10 text-[#F4D389] text-[11px] font-mono uppercase tracking-wider border border-[#F4D389]/20">
              <Sparkles className="w-3 h-3" />
              Bespoke Saree Couture
            </span>
          </div>
          <h1 className="font-serif italic text-3xl sm:text-4xl text-white font-normal">
            Saree Collection Manager
          </h1>
          <p className="text-sm text-white/60 font-light mt-1">
            Add and manage sarees with dual images (front view and detail view) for the public click-to-enlarge lightbox gallery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true)
              loadItems()
            }}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-mono tracking-wider transition-all border border-white/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh items from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/saree-collection"
            target="_blank"
            className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-mono tracking-wider transition-all border border-white/10 flex items-center gap-2 no-underline"
          >
            <span>Live Gallery</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleOpenCreateCard}
            className="px-5 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Saree</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/40 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#F4D389]" />
          <span className="font-mono text-xs uppercase tracking-widest">
            Loading Saree Collection...
          </span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 text-center max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="text-white font-medium mb-1">Failed to Load Sarees</h3>
          <p className="text-xs text-white/60 mb-4">{error}</p>
          <button
            type="button"
            onClick={loadItems}
            className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-mono tracking-wider transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 px-4 border border-dashed border-white/15 rounded-3xl bg-black/30">
          <div className="w-16 h-16 rounded-full bg-[#F4D389]/10 border border-[#F4D389]/20 flex items-center justify-center mx-auto mb-4 text-3xl">
            🥻
          </div>
          <h3 className="font-serif italic text-2xl text-white mb-2">No Sarees in Collection</h3>
          <p className="text-sm text-white/60 font-light max-w-md mx-auto mb-6">
            Click &quot;Add Saree&quot; above to create your first saree card with dual images for the public lightbox gallery.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateCard}
            className="px-6 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Saree Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const sareeCode = getSareeCode(item, index)
            const itemImages = getItemImages(item, sareeCode)
            const img1 = itemImages[0] || null
            const img2 = itemImages[1] || null
            const hasTwoImages = !!(img1 && img2)

            return (
              <div
                key={item.id}
                className="group relative bg-[#0e0e0e] border border-white/10 hover:border-[#F4D389]/40 rounded-3xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Saree Code + Published Badge + Reorder */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-[#F4D389] font-medium tracking-wider">
                        {sareeCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${
                          hasTwoImages
                            ? 'bg-[#F4D389]/15 text-[#F4D389] border-[#F4D389]/30'
                            : 'bg-white/5 text-white/60 border-white/10'
                        }`}
                      >
                        {hasTwoImages ? '2 Images' : '1 Image'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === items.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dual Image Preview Thumbnails */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Image 1: Front View */}
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex flex-col items-center justify-center group/slot">
                      {img1 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img1}
                          alt={`${item.title} front`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/slot:scale-105"
                        />
                      ) : (
                        <div className="text-center p-3 text-white/30">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 text-[#F4D389]/50" />
                          <span className="text-[10px] font-mono block">No Photo</span>
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 right-2 text-center py-0.5 px-2 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono tracking-wider uppercase text-white/90 border border-white/15">
                        Image 1 (Front)
                      </span>
                    </div>

                    {/* Image 2: Detail View */}
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex flex-col items-center justify-center group/slot">
                      {img2 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img2}
                          alt={`${item.title} detail`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/slot:scale-105"
                        />
                      ) : (
                        <div className="text-center p-3 text-white/30">
                          <Plus className="w-5 h-5 mx-auto mb-1 text-white/40" />
                          <span className="text-[10px] font-mono block text-white/40">No Detail View</span>
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 right-2 text-center py-0.5 px-2 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono tracking-wider uppercase text-white/70 border border-white/15">
                        Image 2 (Detail)
                      </span>
                    </div>
                  </div>

                  {/* Card Metadata */}
                  <div className="space-y-1 mb-4">
                    {item.subtitle_badge && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#F4D389] block">
                        {item.subtitle_badge}
                      </span>
                    )}
                    <h3 className="font-serif italic text-lg sm:text-xl text-white font-medium line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/50 font-light line-clamp-2 leading-relaxed">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(item)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider uppercase border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      item.is_published
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {item.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{item.is_published ? 'Published' : 'Hidden'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCard(item, sareeCode)}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-mono tracking-wider transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer hover:border-[#F4D389]/40"
                    >
                      <Edit2 className="w-3 h-3 text-[#F4D389]" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete Saree"
                      className="p-1.5 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================
          ADD / EDIT SAREE MODAL (WITH 2-IMAGE UPLOADER)
         ============================================================ */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-serif italic text-2xl text-white">
                  {editingCard ? `Edit Saree: ${editingCard.title}` : 'Add New Saree to Collection'}
                </h3>
                <p className="text-xs font-mono text-[#F4D389] uppercase tracking-wider mt-0.5">
                  Dual Image Lightbox Gallery Support (Front View + Detail View)
                </p>
              </div>
              <button
                type="button"
                onClick={() => !savingCard && setIsCardModalOpen(false)}
                disabled={savingCard}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCardDetails} className="space-y-6">
              {/* Saree Code & Craft Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Saree Code <span className="text-[#F4D389]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardSareeCode}
                    onChange={(e) => setCardSareeCode(e.target.value)}
                    placeholder="e.g. SR-001"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Craft Badge
                  </label>
                  <input
                    type="text"
                    value={cardBadge}
                    onChange={(e) => setCardBadge(e.target.value)}
                    placeholder="e.g. PURE SILK BROCADE"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none font-mono"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                  Saree Title <span className="text-[#F4D389]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder="e.g. Royal Kanchipuram Gold Saree"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={cardDescription}
                  onChange={(e) => setCardDescription(e.target.value)}
                  placeholder="Heirloom bridal drape woven with pure zari threads, temple borders, and contrast pallu..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none leading-relaxed font-light"
                />
              </div>

              {/* ============================================================
                  DUAL IMAGE UPLOADER SECTION
                 ============================================================ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-[#F4D389]" />
                    <span className="font-mono text-xs uppercase tracking-wider text-white font-medium">
                      Saree Photos (2 Images)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-white/40">
                    JPG, PNG, WEBP (Max 5MB each)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ---------------- SLOT 1: Front / Main View (Required) ---------------- */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-[#F4D389] uppercase tracking-wider font-semibold">
                          Image 1: Front View
                        </span>
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">
                          *Required
                        </span>
                      </div>

                      {image1Preview ? (
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/60 border border-white/15 group/prev mb-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image1Preview}
                            alt="Front View Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/prev:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef1.current?.click()}
                              className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-mono font-medium flex items-center gap-1 shadow-lg hover:bg-neutral-200 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Replace</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setImage1File(null)
                                setImage1Preview(null)
                                setImage1Url('')
                              }}
                              className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-mono font-medium flex items-center gap-1 shadow-lg hover:bg-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            setIsDragging1(true)
                          }}
                          onDragLeave={() => setIsDragging1(false)}
                          onDrop={(e) => {
                            e.preventDefault()
                            setIsDragging1(false)
                            if (e.dataTransfer.files?.[0]) {
                              handleValidateAndSelectFile(e.dataTransfer.files[0], 1)
                            }
                          }}
                          onClick={() => fileInputRef1.current?.click()}
                          className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all mb-3 ${
                            isDragging1
                              ? 'border-[#F4D389] bg-[#F4D389]/10'
                              : 'border-white/15 hover:border-[#F4D389]/50 hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 text-[#F4D389]">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-white font-medium mb-1">
                            Select Front View
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">
                            Drag &amp; drop or click
                          </span>
                        </div>
                      )}

                      <input
                        ref={fileInputRef1}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleValidateAndSelectFile(e.target.files[0], 1)
                          }
                        }}
                      />
                    </div>

                    {/* URL Fallback Toggler */}
                    <div className="pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setShowUrlInput1(!showUrlInput1)}
                        className="text-[10px] font-mono text-white/50 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>{showUrlInput1 ? '▲ Hide URL input' : '▼ Or enter Image 1 URL'}</span>
                      </button>
                      {showUrlInput1 && (
                        <input
                          type="url"
                          value={image1Url}
                          onChange={(e) => {
                            setImage1Url(e.target.value)
                            if (!image1File && e.target.value.trim().startsWith('http')) {
                              setImage1Preview(e.target.value.trim())
                            }
                          }}
                          placeholder="https://..."
                          className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-mono outline-none focus:border-[#F4D389]"
                        />
                      )}
                    </div>
                  </div>

                  {/* ---------------- SLOT 2: Detail / Pallu View (Optional) ---------------- */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-[#F4D389] uppercase tracking-wider font-semibold">
                          Image 2: Detail View
                        </span>
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">
                          Optional
                        </span>
                      </div>

                      {image2Preview ? (
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/60 border border-white/15 group/prev mb-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image2Preview}
                            alt="Detail View Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/prev:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef2.current?.click()}
                              className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-mono font-medium flex items-center gap-1 shadow-lg hover:bg-neutral-200 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Replace</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setImage2File(null)
                                setImage2Preview(null)
                                setImage2Url('')
                              }}
                              className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-mono font-medium flex items-center gap-1 shadow-lg hover:bg-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            setIsDragging2(true)
                          }}
                          onDragLeave={() => setIsDragging2(false)}
                          onDrop={(e) => {
                            e.preventDefault()
                            setIsDragging2(false)
                            if (e.dataTransfer.files?.[0]) {
                              handleValidateAndSelectFile(e.dataTransfer.files[0], 2)
                            }
                          }}
                          onClick={() => fileInputRef2.current?.click()}
                          className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all mb-3 ${
                            isDragging2
                              ? 'border-[#F4D389] bg-[#F4D389]/10'
                              : 'border-white/15 hover:border-[#F4D389]/50 hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 text-white/50">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-white/80 font-medium mb-1">
                            Select Detail View
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">
                            Optional (Close-up / Pallu)
                          </span>
                        </div>
                      )}

                      <input
                        ref={fileInputRef2}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleValidateAndSelectFile(e.target.files[0], 2)
                          }
                        }}
                      />
                    </div>

                    {/* URL Fallback Toggler */}
                    <div className="pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setShowUrlInput2(!showUrlInput2)}
                        className="text-[10px] font-mono text-white/50 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>{showUrlInput2 ? '▲ Hide URL input' : '▼ Or enter Image 2 URL'}</span>
                      </button>
                      {showUrlInput2 && (
                        <input
                          type="url"
                          value={image2Url}
                          onChange={(e) => {
                            setImage2Url(e.target.value)
                            if (!image2File && e.target.value.trim().startsWith('http')) {
                              setImage2Preview(e.target.value.trim())
                            }
                          }}
                          placeholder="https://..."
                          className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-mono outline-none focus:border-[#F4D389]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Publish Visibility Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">Publish on /saree-collection</p>
                  <p className="text-xs text-white/50 font-light">
                    When enabled, this piece is visible to public visitors with click-to-enlarge lightbox.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCardIsPublished(!cardIsPublished)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    cardIsPublished ? 'bg-[#F4D389]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      cardIsPublished ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Upload Progress Indicator */}
              {uploadProgress !== null && (
                <div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F4D389] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#F4D389] block text-right mt-1">
                    Optimizing and uploading images... {uploadProgress}%
                  </span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  disabled={savingCard}
                  className="px-5 py-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCard}
                  className="px-6 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingCard && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCard ? 'Save Saree' : 'Create & Post Saree'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          DELETE CONFIRMATION MODAL
         ============================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-red-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-serif italic text-2xl text-white mb-2">Delete Saree Card?</h3>
            <p className="text-xs text-white/60 mb-6 font-light leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">&quot;{deleteTarget.title}&quot;</strong> from the database?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete Saree</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
