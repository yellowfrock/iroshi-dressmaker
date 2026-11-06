'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  GripVertical,
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

export default function SareeCollectionAdmin() {
  const [items, setItems] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Dedicated Upload / Replace Image Modal state
  const [uploadTarget, setUploadTarget] = useState<{ item: CollectionItem; code: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [directUrl, setDirectUrl] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dedicated Remove Image Modal state
  const [removeTarget, setRemoveTarget] = useState<{ item: CollectionItem; code: string } | null>(null)
  const [removing, setRemoving] = useState(false)

  // Add / Edit Saree Card Modal state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CollectionItem | null>(null)
  const [cardTitle, setCardTitle] = useState('')
  const [cardBadge, setCardBadge] = useState('')
  const [cardSareeCode, setCardSareeCode] = useState('')
  const [cardDescription, setCardDescription] = useState('')
  const [cardDetailUrl, setCardDetailUrl] = useState('')
  const [cardIsPublished, setCardIsPublished] = useState(true)
  const [savingCard, setSavingCard] = useState(false)

  // Delete Card Confirmation state
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Drag and drop reorder state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (message: string, toastType: 'success' | 'error' = 'success') => {
    setToast({ message, type: toastType })
  }

  // Load items
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

  // -------------------------------------------------------------------------
  // UPLOAD / REPLACE IMAGE HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenUploadModal = (item: CollectionItem, code: string) => {
    setUploadTarget({ item, code })
    setSelectedFile(null)
    setPreviewUrl(item.image_url || null)
    setDirectUrl(item.image_url || '')
    setUploadError(null)
    setUploadProgress(null)
  }

  const handleFileSelect = (file: File) => {
    setUploadError(null)

    // Check MIME type
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name)
    if (!isImage) {
      setUploadError('Please select a valid image file (JPEG, PNG, or WebP).')
      return
    }

    // Check max size: 5 MB
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setUploadError(`Image size is ${(file.size / (1024 * 1024)).toFixed(1)} MB, which exceeds the 5 MB limit. Please select a smaller photo.`)
      return
    }

    setSelectedFile(file)
    const objUrl = URL.createObjectURL(file)
    setPreviewUrl(objUrl)
  }

  const handleSaveUploadedImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTarget) return

    if (!selectedFile && !directUrl.trim()) {
      setUploadError('Please select an image file to upload or enter an image URL.')
      return
    }

    setUploading(true)
    setUploadProgress(20)
    setUploadError(null)

    try {
      let finalImageUrl = directUrl.trim()
      let finalImagePath: string | null = null

      if (selectedFile) {
        setUploadProgress(40)
        const fd = new FormData()
        fd.append('file', selectedFile)
        fd.append('folder', 'saree')

        const uploadRes = await uploadCollectionImageAction(fd)
        finalImageUrl = uploadRes.publicUrl
        finalImagePath = uploadRes.imagePath
        setUploadProgress(85)
      }

      const updated = await updateCollectionItem('saree', uploadTarget.item.id, {
        image_url: finalImageUrl,
        image_path: finalImagePath,
      })

      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      showToast(`Image for ${uploadTarget.code} (${updated.title}) saved successfully!`)
      setUploadTarget(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image.'
      setUploadError(msg)
      showToast(msg, 'error')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  // -------------------------------------------------------------------------
  // REMOVE IMAGE HANDLERS
  // -------------------------------------------------------------------------
  const handleConfirmRemoveImage = async () => {
    if (!removeTarget) return
    setRemoving(true)

    try {
      const updated = await removeCollectionItemImage('saree', removeTarget.item.id)
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
      showToast(`Image removed from ${removeTarget.code}. Card now shows its placeholder.`)
      setRemoveTarget(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove image.'
      showToast(msg, 'error')
    } finally {
      setRemoving(false)
    }
  }

  // -------------------------------------------------------------------------
  // CARD DETAILS ADD / EDIT HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenCreateCard = () => {
    setEditingCard(null)
    setCardTitle('')
    setCardBadge('')
    setCardSareeCode(`SR-${String(items.length + 1).padStart(3, '0')}`)
    setCardDescription('')
    setCardDetailUrl('')
    setCardIsPublished(true)
    setIsCardModalOpen(true)
  }

  const handleOpenEditCard = (item: CollectionItem, code: string) => {
    setEditingCard(item)
    setCardTitle(item.title)
    setCardBadge(item.subtitle_badge || '')
    setCardSareeCode(item.saree_code || code)
    setCardDescription(item.description || '')
    setCardDetailUrl(item.detail_url || '')
    setCardIsPublished(item.is_published)
    setIsCardModalOpen(true)
  }

  const handleSaveCardDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardTitle.trim()) {
      showToast('Please provide a title for the saree.', 'error')
      return
    }

    setSavingCard(true)
    try {
      if (editingCard) {
        const updated = await updateCollectionItem('saree', editingCard.id, {
          title: cardTitle,
          subtitle_badge: cardBadge,
          saree_code: cardSareeCode.trim() || null,
          description: cardDescription,
          detail_url: cardDetailUrl,
          is_published: cardIsPublished,
        })
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
        showToast(`"${updated.title}" updated successfully!`)
      } else {
        const created = await createCollectionItem('saree', {
          title: cardTitle,
          subtitle_badge: cardBadge,
          saree_code: cardSareeCode.trim() || null,
          description: cardDescription,
          detail_url: cardDetailUrl,
          image_url: '', // Empty initially, can be uploaded immediately
          image_path: null,
          is_published: cardIsPublished,
          sort_order: items.length + 1,
        })
        setItems((prev) => [...prev, created])
        showToast(`"${created.title}" added to Saree Collection!`)
      }
      setIsCardModalOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save saree card.'
      showToast(msg, 'error')
    } finally {
      setSavingCard(false)
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

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const reordered = [...items]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    setItems(reordered)
    try {
      await reorderCollectionItems('saree', reordered.map((it) => it.id))
      showToast('Saree order updated.')
    } catch (err) {
      setItems(items)
      const msg = err instanceof Error ? err.message : 'Failed to reorder items.'
      showToast(msg, 'error')
    }
  }

  // -------------------------------------------------------------------------
  // DELETE ENTIRE CARD HANDLERS
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
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white pb-20">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-mono border backdrop-blur-md transition-all animate-slide-up ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
              : 'bg-red-950/80 border-red-500/30 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
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
            href="/saree-collection"
            target="_blank"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors no-underline hidden sm:inline-flex items-center gap-1.5"
          >
            <span>View Public /saree-collection</span>
            <ExternalLink className="w-3 h-3 text-[#F4D389]" />
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

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 mb-8 pb-4 border-b border-white/10 font-mono text-xs">
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
            className="px-4 py-2 rounded-full bg-white/15 text-[#F4D389] font-medium border border-[#F4D389]/30 transition-all no-underline"
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

        {/* Section Heading & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4D389]/10 text-[#F4D389] font-mono text-[10px] uppercase tracking-widest mb-2 border border-[#F4D389]/20">
              <Sparkles className="w-3 h-3" />
              <span>Saree Cards Image Management</span>
            </div>
            <h2 className="font-serif italic text-3xl sm:text-4xl text-white font-medium">
              Saree Collection
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl font-light">
              Upload, replace, and remove photograph images for all saree cards (SR-001, SR-002, etc.) displayed on the public /saree-collection showcase.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setRefreshing(true)
                loadItems()
              }}
              disabled={refreshing}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Items"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateCard}
              className="px-5 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(244,211,137,0.3)] flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Saree Card</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#F4D389] animate-spin mb-3" />
            <p className="font-mono text-xs text-white/50">Loading Saree Collection records...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-200 text-xs font-mono mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Database Communication Note</p>
              <p className="opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="p-12 sm:p-16 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 text-[#F4D389]">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-serif italic text-2xl text-white mb-2">No Saree Cards in Database</h3>
            <p className="text-xs sm:text-sm text-white/60 font-light mb-6">
              Create your saree cards to start uploading and managing their photographs.
            </p>
            <button
              onClick={handleOpenCreateCard}
              className="px-6 py-3 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Saree Card</span>
            </button>
          </div>
        )}

        {/* Saree Cards List */}
        {!loading && items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/40 px-4 py-2 border-b border-white/5">
              <span>Saree Cards ({items.length})</span>
              <span>Image Upload &amp; Management</span>
            </div>

            {items.map((item, index) => {
              const sareeCode = getSareeCode(item, index)
              const hasImage = Boolean(item.image_url && item.image_url.trim())

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 hover:border-white/20 transition-all ${
                    !item.is_published ? 'opacity-65 bg-black/60' : ''
                  }`}
                >
                  {/* Left: Reorder & Thumbnail & Saree Information */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1 items-center justify-center pt-1 sm:pt-0">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Saree Thumbnail or Placeholder */}
                    <div className="relative w-16 h-22 sm:w-20 sm:h-26 rounded-xl overflow-hidden bg-black/70 border border-white/15 flex-shrink-0 flex items-center justify-center shadow-md">
                      {hasImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url!}
                          alt={item.title}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center bg-gradient-to-b from-[#18181b] to-[#0a0a0a]">
                          <span className="text-xl mb-0.5">🥻</span>
                          <span className="font-mono text-[9px] text-[#F4D389] font-bold">
                            {sareeCode}
                          </span>
                          <span className="text-[8px] font-mono text-white/40">No Image</span>
                        </div>
                      )}

                      {!item.is_published && (
                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                          <EyeOff className="w-3.5 h-3.5 text-white/60" />
                        </div>
                      )}
                    </div>

                    {/* Saree Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Prominent Saree Code Pill */}
                        <span className="px-2.5 py-0.5 rounded-full bg-black/80 border border-[#F4D389]/60 text-[#F4D389] font-mono text-xs font-semibold tracking-wider">
                          {sareeCode}
                        </span>

                        <h3 className="font-serif italic text-base sm:text-lg font-medium text-white truncate">
                          {item.title}
                        </h3>

                        {item.subtitle_badge && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-[10px] font-mono uppercase tracking-wider truncate">
                            {item.subtitle_badge}
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-white/30">
                          #{item.sort_order || index + 1}
                        </span>
                      </div>

                      <p className="text-xs text-white/55 line-clamp-2 font-light leading-relaxed max-w-xl">
                        {item.description || 'No description entered.'}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                        {hasImage ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Photo Active</span>
                          </span>
                        ) : (
                          <span className="text-amber-400/90 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>No Photo (Default Placeholder Shown on Site)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: PRIMARY IMAGE ACTIONS + Secondary Controls */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap md:flex-nowrap justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                    {/* Primary Image Action: Upload or Replace */}
                    {hasImage ? (
                      <button
                        onClick={() => handleOpenUploadModal(item, sareeCode)}
                        className="px-3.5 py-2 rounded-full bg-[#F4D389]/10 hover:bg-[#F4D389]/20 text-[#F4D389] border border-[#F4D389]/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer hover:border-[#F4D389] shadow-sm"
                        title="Upload a new photo to replace current image"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replace image</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenUploadModal(item, sareeCode)}
                        className="px-4 py-2 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(244,211,137,0.35)] cursor-pointer active:scale-95"
                        title="Upload photograph for this saree card"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload image</span>
                      </button>
                    )}

                    {/* Remove image button (only shown when image exists) */}
                    {hasImage && (
                      <button
                        onClick={() => setRemoveTarget({ item, code: sareeCode })}
                        className="px-3 py-2 rounded-full bg-red-950/20 hover:bg-red-900/40 text-red-300 border border-red-500/25 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer hover:text-red-200 hover:border-red-500/50"
                        title="Remove image and restore default atelier placeholder"
                      >
                        <ImageOff className="w-3.5 h-3.5" />
                        <span>Remove image</span>
                      </button>
                    )}

                    <span className="w-px h-5 bg-white/10 hidden sm:inline-block" />

                    {/* Publish / Draft Toggle */}
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className={`p-2 rounded-full text-xs font-mono flex items-center gap-1 transition-all cursor-pointer border ${
                        item.is_published
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60'
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'
                      }`}
                      title={item.is_published ? 'Click to unpublish' : 'Click to publish'}
                    >
                      {item.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit Card Details */}
                    <button
                      onClick={() => handleOpenEditCard(item, sareeCode)}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer"
                      title="Edit Saree Details (Title, Craft, Saree Code)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Saree Card */}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 rounded-full bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 text-red-400 hover:text-red-200 text-xs font-mono transition-all cursor-pointer"
                      title="Delete Saree Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ============================================================
          1. UPLOAD / REPLACE IMAGE MODAL
         ============================================================ */}
      {uploadTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#0e0e0e] border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-black border border-[#F4D389]/60 font-mono text-[11px] text-[#F4D389] uppercase tracking-wider mb-1 font-semibold">
                  {uploadTarget.code}
                </div>
                <h3 className="font-serif italic text-2xl text-white">
                  {uploadTarget.item.image_url ? 'Replace Saree Photograph' : 'Upload Saree Photograph'}
                </h3>
                <p className="text-xs text-white/50 font-light mt-0.5">
                  {uploadTarget.item.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadTarget(null)}
                disabled={uploading}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-mono mb-5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Form */}
            <form onSubmit={handleSaveUploadedImage} className="space-y-6">
              {/* Drag & Drop File Picker */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Select Image File (Max 5 MB) <span className="text-[#F4D389]">*</span>
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0])
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[220px] ${
                    isDragging
                      ? 'border-[#F4D389] bg-[#F4D389]/10'
                      : 'border-white/15 hover:border-white/30 bg-black/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onClick={(e) => {
                      ;(e.target as HTMLInputElement).value = ''
                    }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                  />

                  {previewUrl ? (
                    <div className="relative w-full flex flex-col items-center">
                      <div className="relative w-36 h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-3 bg-black/80 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Saree Preview"
                          className="w-full h-full object-cover object-center"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 cursor-pointer text-white"
                        >
                          <Upload className="w-5 h-5 text-[#F4D389]" />
                          <span className="text-[11px] font-mono font-medium">Select Different Photo</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-white/90 font-medium max-w-xs truncate">
                          {selectedFile ? selectedFile.name : 'Current Saved Photograph'}
                        </span>
                        {selectedFile && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#F4D389]" />
                          <span>{selectedFile ? 'Change File' : 'Pick New File'}</span>
                        </button>

                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null)
                              setPreviewUrl(uploadTarget.item.image_url || null)
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/25 text-red-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Reset selected file"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Revert</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer w-full flex flex-col items-center justify-center py-6"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-white/70 group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6 text-[#F4D389]" />
                      </div>
                      <p className="text-sm text-white font-medium mb-1">
                        Click to select image or drag &amp; drop
                      </p>
                      <p className="text-xs font-mono text-white/40">
                        JPEG, PNG, or WebP (maximum 5 MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Direct URL input fallback */}
                <div className="mt-4">
                  <label className="block text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1">
                    Or Image URL (Supabase CDN, Cloudinary, Unsplash)
                  </label>
                  <input
                    type="url"
                    value={directUrl}
                    onChange={(e) => {
                      const val = e.target.value
                      setDirectUrl(val)
                      if (!selectedFile && val.trim().startsWith('http')) {
                        setPreviewUrl(val.trim())
                      }
                    }}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-xs font-mono focus:outline-none focus:border-[#F4D389] transition-colors"
                  />
                </div>

                {/* Upload Progress Bar */}
                {uploadProgress !== null && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F4D389] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#F4D389] block text-right mt-1">
                      Saving image... {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setUploadTarget(null)}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!selectedFile && !directUrl.trim())}
                  className="px-6 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Image</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          2. REMOVE IMAGE CONFIRMATION MODAL
         ============================================================ */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-red-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
              <ImageOff className="w-6 h-6" />
            </div>

            <h3 className="font-serif italic text-2xl text-white mb-2">Remove Saree Image?</h3>
            <p className="text-xs text-white/70 mb-6 font-light leading-relaxed">
              Are you sure you want to remove the photograph from{' '}
              <strong className="text-[#F4D389]">{removeTarget.code} — {removeTarget.item.title}</strong>?
              <br /><br />
              The saree card will remain on the public <strong className="text-white">/saree-collection</strong> showcase and display its default atelier placeholder until you upload a new photo.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveImage}
                disabled={removing}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {removing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Remove Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          3. ADD / EDIT CARD DETAILS MODAL
         ============================================================ */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#0e0e0e] border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-serif italic text-2xl text-white">
                  {editingCard ? `Edit Saree: ${editingCard.title}` : 'Add New Saree Card'}
                </h3>
                <p className="text-xs font-mono text-[#F4D389] uppercase tracking-wider mt-0.5">
                  Saree Card Details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCardModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCardDetails} className="space-y-5">
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

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                  Title <span className="text-[#F4D389]">*</span>
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

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={cardDescription}
                  onChange={(e) => setCardDescription(e.target.value)}
                  placeholder="Describe the weave, embroidery, and atelier artistry..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none leading-relaxed font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                  Detail Link (Optional)
                </label>
                <input
                  type="text"
                  value={cardDetailUrl}
                  onChange={(e) => setCardDetailUrl(e.target.value)}
                  placeholder="https://... or /contact"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-xs font-mono outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">Publish on /saree-collection</p>
                  <p className="text-xs text-white/50 font-light">
                    When enabled, this piece is visible to website visitors.
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-5 py-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCard}
                  className="px-6 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingCard && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCard ? 'Save Details' : 'Create Card'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          4. DELETE CARD CONFIRMATION MODAL
         ============================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-red-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-serif italic text-2xl text-white mb-2">Delete Saree Card?</h3>
            <p className="text-xs text-white/60 mb-6 font-light leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{deleteTarget.title}"</strong> from the database?
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
                <span>Delete Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

