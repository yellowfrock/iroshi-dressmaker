'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
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
} from 'lucide-react'
import type { CollectionItem } from '@/types'
import {
  type CollectionType,
  getAdminCollectionItems,
  createCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  togglePublishCollectionItem,
  reorderCollectionItems,
  uploadCollectionImageAction,
} from '@/app/admin/actions/collections'

interface CollectionManagerProps {
  type: CollectionType
  title: string
  subtitle: string
}

export default function CollectionManager({ type, title, subtitle }: CollectionManagerProps) {
  const [items, setItems] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Form Fields
  const [formTitle, setFormTitle] = useState('')
  const [formBadge, setFormBadge] = useState('')
  const [formSareeCode, setFormSareeCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDetailUrl, setFormDetailUrl] = useState('')
  const [formIsPublished, setFormIsPublished] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formImagePath, setFormImagePath] = useState<string | null>(null)

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation modal state
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

  // Load items on mount or when type changes
  const loadItems = async () => {
    try {
      setError(null)
      const data = await getAdminCollectionItems(type)
      setItems(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load collection items.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadItems()
  }, [type])

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormBadge('')
    setFormSareeCode('')
    setFormDescription('')
    setFormDetailUrl('')
    setFormIsPublished(true)
    setFormImageUrl('')
    setFormImagePath(null)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(null)
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (item: CollectionItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormBadge(item.subtitle_badge || '')
    setFormSareeCode(item.saree_code || '')
    setFormDescription(item.description || '')
    setFormDetailUrl(item.detail_url || '')
    setFormIsPublished(item.is_published)
    setFormImageUrl(item.image_url)
    setFormImagePath(item.image_path)
    setSelectedFile(null)
    setPreviewUrl(item.image_url)
    setUploadProgress(null)
    setIsModalOpen(true)
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name)
    if (!isImage) {
      showToast('Please select a valid image file (JPEG, PNG, or WebP).', 'error')
      return
    }

    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_SIZE) {
      showToast('Image size exceeds 10 MB. Please choose a smaller image.', 'error')
      return
    }

    setSelectedFile(file)
    const objUrl = URL.createObjectURL(file)
    setPreviewUrl(objUrl)
  }

  // Form Submission (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      showToast('Please provide a title for the collection item.', 'error')
      return
    }

    if (!selectedFile && !formImageUrl.trim()) {
      showToast('Please upload an image or provide an image URL.', 'error')
      return
    }

    setSaving(true)
    try {
      let finalImageUrl = formImageUrl.trim()
      let finalImagePath = formImagePath

      // If user selected a new file, perform upload with dual-channel fallback
      if (selectedFile) {
        setUploadProgress(20)
        let uploadSucceeded = false
        let uploadErrorMsg = ''

        // 1. Try direct Supabase storage upload first
        try {
          const supabase = createClient()
          const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const storagePath = `${type}/${Date.now()}_${cleanFileName}`

          setUploadProgress(45)
          const { error: directErr } = await supabase.storage
            .from('collection-images')
            .upload(storagePath, selectedFile, {
              cacheControl: '3600',
              upsert: true,
            })

          if (!directErr) {
            const {
              data: { publicUrl },
            } = supabase.storage.from('collection-images').getPublicUrl(storagePath)

            finalImageUrl = publicUrl
            finalImagePath = storagePath
            uploadSucceeded = true
            setUploadProgress(100)
          } else {
            uploadErrorMsg = directErr.message
            console.warn('[handleFileUpload] Client upload note:', directErr.message)
          }
        } catch (clientErr) {
          uploadErrorMsg = clientErr instanceof Error ? clientErr.message : String(clientErr)
          console.warn('[handleFileUpload] Client upload fallback:', clientErr)
        }

        // 2. If client upload didn't succeed, fallback to server action (uses service role)
        if (!uploadSucceeded) {
          setUploadProgress(65)
          try {
            const fd = new FormData()
            fd.append('file', selectedFile)
            fd.append('folder', type)

            const uploadRes = await uploadCollectionImageAction(fd)
            finalImageUrl = uploadRes.publicUrl
            finalImagePath = uploadRes.imagePath
            uploadSucceeded = true
            setUploadProgress(100)
          } catch (actionErr) {
            const msg = actionErr instanceof Error ? actionErr.message : uploadErrorMsg || 'Upload failed'
            console.error('[handleFileUpload] Server action upload failed:', actionErr)
            throw new Error(`Failed to upload image: ${msg}`)
          }
        }
      }

      if (editingItem) {
        // Update
        const updated = await updateCollectionItem(type, editingItem.id, {
          title: formTitle,
          subtitle_badge: formBadge,
          saree_code: type === 'saree' ? (formSareeCode.trim() || null) : undefined,
          description: formDescription,
          detail_url: formDetailUrl,
          image_url: finalImageUrl,
          image_path: finalImagePath,
          is_published: formIsPublished,
        })
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
        showToast(`"${updated.title}" updated successfully!`)
      } else {
        // Create
        const created = await createCollectionItem(type, {
          title: formTitle,
          subtitle_badge: formBadge,
          saree_code: type === 'saree' ? (formSareeCode.trim() || null) : undefined,
          description: formDescription,
          detail_url: formDetailUrl,
          image_url: finalImageUrl,
          image_path: finalImagePath,
          is_published: formIsPublished,
          sort_order: items.length + 1,
        })
        setItems((prev) => [...prev, created])
        showToast(`"${created.title}" added to ${title}!`)
      }

      setIsModalOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save item.'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
      setUploadProgress(null)
    }
  }

  // Toggle published
  const handleTogglePublish = async (item: CollectionItem) => {
    const nextState = !item.is_published
    // Optimistic update
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_published: nextState } : it)))

    try {
      await togglePublishCollectionItem(type, item.id, nextState)
      showToast(`${item.title} is now ${nextState ? 'published' : 'hidden'}.`)
    } catch (err) {
      // Revert optimistic update
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_published: !nextState } : it)))
      const msg = err instanceof Error ? err.message : 'Failed to update visibility.'
      showToast(msg, 'error')
    }
  }

  // Reorder: Move Up / Move Down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const newItems = [...items]
    const [moved] = newItems.splice(index, 1)
    newItems.splice(targetIndex, 0, moved)

    setItems(newItems)

    try {
      const orderedIds = newItems.map((it) => it.id)
      await reorderCollectionItems(type, orderedIds)
      showToast('Order updated successfully.')
    } catch (err) {
      showToast('Failed to save updated order.', 'error')
      loadItems() // Reload original state
    }
  }

  // HTML5 Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newItems = [...items]
    const [moved] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, moved)

    setDraggedIndex(index)
    setItems(newItems)
  }

  const handleDragEnd = async () => {
    setDraggedIndex(null)
    try {
      const orderedIds = items.map((it) => it.id)
      await reorderCollectionItems(type, orderedIds)
      showToast('Order updated successfully.')
    } catch {
      showToast('Failed to save drag order.', 'error')
      loadItems()
    }
  }

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCollectionItem(type, deleteTarget.id)
      setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id))
      showToast(`"${deleteTarget.title}" was deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete item.'
      showToast(msg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans pb-24">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border transition-all text-xs font-mono tracking-wide ${
            toast.type === 'success'
              ? 'bg-[#0f1710] border-emerald-500/30 text-emerald-300'
              : 'bg-[#1a0a0a] border-red-500/30 text-red-300'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
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
            className={`px-4 py-2 rounded-full transition-all no-underline ${
              type === 'latest'
                ? 'bg-white/15 text-[#F4D389] font-medium border border-[#F4D389]/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Latest Collection
          </Link>
          <Link
            href="/admin/saree-collection"
            className={`px-4 py-2 rounded-full transition-all no-underline ${
              type === 'saree'
                ? 'bg-white/15 text-[#F4D389] font-medium border border-[#F4D389]/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
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
              <span>Interactive Showcase Database</span>
            </div>
            <h2 className="font-serif italic text-3xl sm:text-4xl text-white font-medium">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl font-light">
              {subtitle}
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
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(244,211,137,0.3)] flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#F4D389] animate-spin mb-3" />
            <p className="font-mono text-xs text-white/50">Loading {title} records...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-200 text-xs font-mono mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Database Communication Error</p>
              <p className="opacity-80">{error}</p>
              <p className="mt-2 text-white/60 text-[11px]">
                Tip: Ensure you have executed migration <code className="text-[#F4D389]">005_collections.sql</code> in your Supabase SQL Editor.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="p-12 sm:p-16 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 text-[#F4D389]">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-serif italic text-2xl text-white mb-2">No Items in this Collection</h3>
            <p className="text-xs sm:text-sm text-white/60 font-light mb-6">
              Start by uploading photographs of your handcrafted garments, bridal sarees, or bespoke couture commissions.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Item</span>
            </button>
          </div>
        )}

        {/* Items List */}
        {!loading && items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/40 px-4 py-2">
              <span>Collection Items ({items.length})</span>
              <span>Reorder / Status / Actions</span>
            </div>

            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d0d0d] border border-white/10 hover:border-white/20 transition-all ${
                  !item.is_published ? 'opacity-60 bg-black/60' : ''
                } ${draggedIndex === index ? 'border-[#F4D389] bg-white/5' : ''}`}
              >
                {/* Drag Handle & Reorder */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/70 p-1" title="Drag to reorder">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
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
                </div>

                {/* Thumbnail Image */}
                <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  {!item.is_published && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <EyeOff className="w-3.5 h-3.5 text-white/60" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-serif italic text-base sm:text-lg font-medium text-white truncate">
                      {item.title}
                    </h4>
                    {item.saree_code && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D81B2B]/20 border border-[#D81B2B]/40 text-red-200 text-[10px] font-mono font-semibold">
                        {item.saree_code}
                      </span>
                    )}
                    {item.subtitle_badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[#F4D389] text-[9px] font-mono uppercase tracking-widest truncate">
                        {item.subtitle_badge}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-white/30">
                      #{item.sort_order || index + 1}
                    </span>
                  </div>

                  <p className="text-xs text-white/50 line-clamp-1 font-light max-w-xl">
                    {item.description || 'No description provided.'}
                  </p>

                  {item.detail_url && (
                    <a
                      href={item.detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-[#F4D389]/80 hover:text-[#F4D389] mt-1 no-underline"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                {/* Status Toggle & Actions */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {/* Published Toggle */}
                  <button
                    onClick={() => handleTogglePublish(item)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                      item.is_published
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'
                    }`}
                    title={item.is_published ? 'Click to unpublish' : 'Click to publish'}
                  >
                    {item.is_published ? (
                      <>
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline">Published</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span className="hidden sm:inline">Draft</span>
                      </>
                    )}
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-red-950/30 hover:bg-red-900/50 border border-red-500/20 text-red-300 hover:text-red-200 text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ============================================================
          ADD / EDIT MODAL
         ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-serif italic text-2xl text-white">
                  {editingItem ? `Edit: ${editingItem.title}` : `Add to ${title}`}
                </h3>
                <p className="text-xs font-mono text-[#F4D389] uppercase tracking-wider mt-0.5">
                  Collection Item Specification
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Image Upload & Management Area */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Garment Photograph <span className="text-[#F4D389]">*</span>
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
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[190px] ${
                    isDragging
                      ? 'border-[#F4D389] bg-[#F4D389]/5'
                      : 'border-white/15 hover:border-white/25 bg-black/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
                    className="hidden"
                    onClick={(e) => {
                      // Reset file input value so re-selecting same file triggers onChange
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
                      <div className="relative w-32 h-40 rounded-xl overflow-hidden border border-white/20 shadow-xl mb-3 bg-black/60 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Garment Preview"
                          className="w-full h-full object-cover object-center"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 cursor-pointer text-white"
                        >
                          <Upload className="w-5 h-5 text-[#F4D389]" />
                          <span className="text-[11px] font-mono font-medium">Replace Image</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-white/90 font-medium max-w-xs truncate">
                          {selectedFile ? selectedFile.name : (editingItem ? 'Current Saved Image' : 'Selected Image')}
                        </span>
                        {selectedFile && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#F4D389]" />
                          <span>{selectedFile ? 'Change File' : 'Replace Image'}</span>
                        </button>

                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null)
                              setPreviewUrl(editingItem?.image_url || formImageUrl || null)
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/25 text-red-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Cancel replacement and keep current image"
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
                      className="cursor-pointer w-full flex flex-col items-center justify-center py-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/60 group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5 text-[#F4D389]" />
                      </div>
                      <p className="text-sm text-white font-medium mb-1">
                        Click to upload or drag &amp; drop
                      </p>
                      <p className="text-xs font-mono text-white/40">
                        JPEG, PNG, WebP or AVIF (up to 10 MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Direct Image URL input */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                      Or Direct Image URL (Cloudinary, Unsplash, Supabase CDN)
                    </label>
                    {selectedFile && (
                      <span className="text-[10px] font-mono text-[#F4D389]">
                        (Uploaded file will take priority upon saving)
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormImageUrl(val)
                      if (!selectedFile && val.trim().startsWith('http')) {
                        setPreviewUrl(val.trim())
                      }
                    }}
                    placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-xs font-mono focus:outline-none focus:border-[#F4D389] transition-colors"
                  />
                </div>

                {uploadProgress !== null && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F4D389] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#F4D389] block text-right mt-1">
                      Uploading image... {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Title, Saree Code & Badge */}
              <div className={`grid grid-cols-1 ${type === 'saree' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                    Title <span className="text-[#F4D389]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Ivory Bridal Masterpiece"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none transition-all placeholder:text-white/20"
                  />
                </div>

                {type === 'saree' && (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                      Saree Code (e.g. SR-001)
                    </label>
                    <input
                      type="text"
                      value={formSareeCode}
                      onChange={(e) => setFormSareeCode(e.target.value)}
                      placeholder="e.g. SR-001"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none transition-all placeholder:text-white/20 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                    Craft Badge / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. ZARDOSI EMBROIDERY"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none transition-all placeholder:text-white/20 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Description / Atelier Narrative
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detail the hand-embroidery, imported fabrics, silhouette draping, and artisanal techniques..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none transition-all placeholder:text-white/20 leading-relaxed font-light"
                />
              </div>

              {/* Detail URL */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Detail Link (Optional)
                </label>
                <input
                  type="text"
                  value={formDetailUrl}
                  onChange={(e) => setFormDetailUrl(e.target.value)}
                  placeholder="https://... or /rental or /booking"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-[#F4D389] text-white text-sm outline-none transition-all placeholder:text-white/20 font-mono text-xs"
                />
              </div>

              {/* Published Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">Publish to Public Site</p>
                  <p className="text-xs text-white/50 font-light">
                    When enabled, this piece is visible on the public website showcase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsPublished(!formIsPublished)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    formIsPublished ? 'bg-[#F4D389]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                      formIsPublished ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Item'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-red-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-serif italic text-2xl text-white mb-2">Delete Collection Item?</h3>
            <p className="text-xs text-white/60 mb-6 font-light leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{deleteTarget.title}"</strong>?
              This action will permanently delete the item and its stored image file from the cloud bucket.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer"
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
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
