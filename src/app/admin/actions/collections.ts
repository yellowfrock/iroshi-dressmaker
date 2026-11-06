'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { CollectionItem } from '@/types'

export type CollectionType = 'latest' | 'saree'

function getTableName(type: CollectionType): string {
  return type === 'latest' ? 'latest_collection_items' : 'saree_collection_items'
}

/**
 * Asserts the current user has an active authenticated admin session.
 */
async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: Admin access required.')
  }

  return user
}

function revalidateAllCollectionPages() {
  revalidatePath('/')
  revalidatePath('/portfolio')
  revalidatePath('/saree-collection')
  revalidatePath('/admin/latest-collection')
  revalidatePath('/admin/saree-collection')
}

/**
 * Normalizes database item so `images` array always contains [image1, image2]
 * and fallbacks for missing columns operate smoothly.
 */
function normalizeCollectionItem(data: any, fallbackCode?: string | null): CollectionItem {
  if (!data) return data
  const rawImages: string[] = []
  if (Array.isArray(data.images)) {
    data.images.forEach((img: unknown) => {
      if (typeof img === 'string' && img.trim()) rawImages.push(img.trim())
    })
  }
  if (rawImages.length === 0) {
    if (data.image_url && typeof data.image_url === 'string' && data.image_url.trim()) {
      rawImages.push(data.image_url.trim())
    }
    if (data.detail_url && typeof data.detail_url === 'string' && data.detail_url.trim()) {
      rawImages.push(data.detail_url.trim())
    }
  }

  return {
    ...data,
    saree_code: data.saree_code || fallbackCode || null,
    images: rawImages,
    image_url: rawImages[0] || data.image_url || '',
    detail_url: rawImages[1] || data.detail_url || null,
  } as CollectionItem
}

/**
 * Safely inserts into a Supabase table. If a column is missing from schema cache
 * (PostgREST PGRST204 error), it strips that column and retries automatically.
 */
async function safeInsert(adminClient: any, tableName: string, payload: Record<string, unknown>) {
  const currentPayload = { ...payload }
  while (true) {
    const { data, error } = await adminClient
      .from(tableName)
      .insert(currentPayload)
      .select()
      .single()

    if (!error) return data
    if (error.code === 'PGRST204') {
      const match = error.message.match(/Could not find the '([^']+)' column/)
      if (match && match[1] in currentPayload) {
        console.warn(`[safeInsert] Column '${match[1]}' not in ${tableName} schema. Stripping and retrying.`)
        delete currentPayload[match[1]]
        continue
      }
    }
    console.error(`[safeInsert] Error inserting into ${tableName}:`, error.message)
    throw new Error(error.message)
  }
}

/**
 * Safely updates a Supabase row. If a column is missing from schema cache
 * (PostgREST PGRST204 error), it strips that column and retries automatically.
 */
async function safeUpdate(adminClient: any, tableName: string, id: string, payload: Record<string, unknown>) {
  const currentPayload = { ...payload }
  while (true) {
    const { data, error } = await adminClient
      .from(tableName)
      .update(currentPayload)
      .eq('id', id)
      .select()
      .single()

    if (!error) return data
    if (error.code === 'PGRST204') {
      const match = error.message.match(/Could not find the '([^']+)' column/)
      if (match && match[1] in currentPayload) {
        console.warn(`[safeUpdate] Column '${match[1]}' not in ${tableName} schema. Stripping and retrying.`)
        delete currentPayload[match[1]]
        continue
      }
    }
    console.error(`[safeUpdate] Error updating ${tableName}:`, error.message)
    throw new Error(error.message)
  }
}

/**
 * Fetch all items for admin list view (both published and unpublished).
 */
export async function getAdminCollectionItems(type: CollectionType): Promise<CollectionItem[]> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  const { data, error } = await adminClient
    .from(tableName)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`[getAdminCollectionItems] Error fetching ${tableName}:`, error.message)
    throw new Error(error.message)
  }

  return ((data || []) as any[]).map((it) => normalizeCollectionItem(it))
}

export interface CreateCollectionItemInput {
  title: string
  subtitle_badge?: string | null
  description?: string | null
  image_url: string
  image_path?: string | null
  detail_url?: string | null
  images?: string[] | null
  sort_order?: number
  is_published?: boolean
  saree_code?: string | null
}

/**
 * Create a new collection item supporting 2 images (front view and detail view).
 */
export async function createCollectionItem(
  type: CollectionType,
  input: CreateCollectionItemInput
): Promise<CollectionItem> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  const images = (input.images && input.images.length > 0)
    ? input.images.filter(Boolean)
    : [input.image_url, input.detail_url].filter(Boolean) as string[]

  const insertPayload: Record<string, unknown> = {
    title: input.title.trim(),
    subtitle_badge: input.subtitle_badge?.trim() || null,
    description: input.description?.trim() || null,
    image_url: (images[0] || input.image_url || '').trim(),
    image_path: input.image_path?.trim() || null,
    detail_url: (images[1] || input.detail_url || '').trim() || null,
    sort_order: input.sort_order ?? 0,
    is_published: input.is_published ?? true,
  }

  if (type === 'saree') {
    if (input.saree_code !== undefined && input.saree_code !== null) {
      insertPayload.saree_code = input.saree_code.trim() || null
    }
    insertPayload.images = images
  }

  const data = await safeInsert(adminClient, tableName, insertPayload)
  revalidateAllCollectionPages()
  return normalizeCollectionItem(data, input.saree_code)
}

export interface UpdateCollectionItemInput {
  title?: string
  subtitle_badge?: string | null
  description?: string | null
  image_url?: string | null
  image_path?: string | null
  detail_url?: string | null
  images?: string[] | null
  sort_order?: number
  is_published?: boolean
  saree_code?: string | null
}

/**
 * Update an existing collection item, safely cleaning up old storage images if replaced.
 */
export async function updateCollectionItem(
  type: CollectionType,
  id: string,
  input: UpdateCollectionItemInput
): Promise<CollectionItem> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  // If replacing primary image, fetch previous image_path to delete old file
  const isReplacingImage = input.image_path !== undefined || (input.image_url !== undefined && input.image_path === null)
  if (isReplacingImage) {
    const { data: existing } = await adminClient
      .from(tableName)
      .select('image_path')
      .eq('id', id)
      .single()

    if (existing?.image_path && existing.image_path !== input.image_path) {
      try {
        await adminClient.storage.from('collection-images').remove([existing.image_path])
      } catch (err) {
        console.warn(`[updateCollectionItem] Could not remove old image ${existing.image_path}:`, err)
      }
    }
  }

  const updatePayload: Record<string, unknown> = {}
  if (input.title !== undefined) updatePayload.title = input.title.trim()
  if (input.subtitle_badge !== undefined) updatePayload.subtitle_badge = input.subtitle_badge?.trim() || null
  if (input.description !== undefined) updatePayload.description = input.description?.trim() || null
  if (input.image_url !== undefined) updatePayload.image_url = input.image_url ? input.image_url.trim() : null
  if (input.image_path !== undefined) updatePayload.image_path = input.image_path?.trim() || null
  if (input.detail_url !== undefined) updatePayload.detail_url = input.detail_url ? input.detail_url.trim() : null
  if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order
  if (input.is_published !== undefined) updatePayload.is_published = input.is_published

  if (type === 'saree') {
    if (input.saree_code !== undefined) {
      updatePayload.saree_code = input.saree_code?.trim() || null
    }
    if (input.images !== undefined) {
      updatePayload.images = input.images
      if (input.images && input.images.length > 0) {
        updatePayload.image_url = input.images[0] || null
        updatePayload.detail_url = input.images[1] || null
      } else if (input.images && input.images.length === 0) {
        updatePayload.image_url = null
        updatePayload.detail_url = null
      }
    }
  }

  const data = await safeUpdate(adminClient, tableName, id, updatePayload)
  revalidateAllCollectionPages()
  return normalizeCollectionItem(data, input.saree_code)
}

/**
 * Delete a collection item and its associated storage file.
 */
export async function deleteCollectionItem(type: CollectionType, id: string): Promise<boolean> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  const { data: existing } = await adminClient
    .from(tableName)
    .select('image_path')
    .eq('id', id)
    .single()

  if (existing?.image_path) {
    try {
      await adminClient.storage.from('collection-images').remove([existing.image_path])
    } catch (err) {
      console.warn(`[deleteCollectionItem] Could not remove image ${existing.image_path}:`, err)
    }
  }

  const { error } = await adminClient.from(tableName).delete().eq('id', id)

  if (error) {
    console.error(`[deleteCollectionItem] Error deleting from ${tableName}:`, error.message)
    throw new Error(error.message)
  }

  revalidateAllCollectionPages()
  return true
}

/**
 * Toggle published state of an item.
 */
export async function togglePublishCollectionItem(
  type: CollectionType,
  id: string,
  is_published: boolean
): Promise<boolean> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  const { error } = await adminClient
    .from(tableName)
    .update({ is_published })
    .eq('id', id)

  if (error) {
    console.error(`[togglePublishCollectionItem] Error toggling status in ${tableName}:`, error.message)
    throw new Error(error.message)
  }

  revalidateAllCollectionPages()
  return true
}

/**
 * Reorder collection items by array of ids.
 */
export async function reorderCollectionItems(
  type: CollectionType,
  orderedIds: string[]
): Promise<boolean> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  const updates = orderedIds.map((id, index) =>
    adminClient
      .from(tableName)
      .update({ sort_order: index + 1 })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    console.error(`[reorderCollectionItems] Error reordering in ${tableName}:`, failed.error.message)
    throw new Error(failed.error.message)
  }

  revalidateAllCollectionPages()
  return true
}

/**
 * Upload an image to the 'collection-images' bucket via server action.
 * Enforces file size <= 10MB and allowed mime types (jpeg, png, webp, avif).
 */
export async function uploadCollectionImageAction(
  formData: FormData
): Promise<{ publicUrl: string; imagePath: string }> {
  await assertAdmin()
  const adminClient = await createAdminClient()

  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'latest'

  if (!file || !(file instanceof File)) {
    throw new Error('No valid file provided for upload.')
  }

  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name)
  if (!isImage) {
    throw new Error('Invalid file format. Please upload a JPEG, PNG, or WebP image.')
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB limit
  if (file.size > MAX_SIZE) {
    throw new Error('File exceeds maximum size of 10 MB.')
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const imagePath = `${folder}/${Date.now()}_${cleanFileName}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  let contentType = file.type
  if (!contentType || contentType === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'png') contentType = 'image/png'
    else if (ext === 'webp') contentType = 'image/webp'
    else if (ext === 'gif') contentType = 'image/gif'
    else if (ext === 'avif') contentType = 'image/avif'
    else contentType = 'image/jpeg'
  }

  const { error: uploadErr } = await adminClient.storage
    .from('collection-images')
    .upload(imagePath, buffer, {
      contentType,
      upsert: true,
    })

  if (uploadErr) {
    console.error('[uploadCollectionImageAction] Upload failed:', uploadErr.message)
    throw new Error(`Upload failed: ${uploadErr.message}`)
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from('collection-images').getPublicUrl(imagePath)

  return { publicUrl, imagePath }
}

/**
 * Remove an image from a collection item without deleting the card itself.
 * Sets image_url to null and image_path to null, and deletes the storage file if present.
 */
export async function removeCollectionItemImage(
  type: CollectionType,
  id: string,
  slot: 1 | 2 = 1
): Promise<CollectionItem> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  const { data: existing } = await adminClient
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single()

  if (slot === 1) {
    if (existing?.image_path) {
      try {
        await adminClient.storage.from('collection-images').remove([existing.image_path])
      } catch (err) {
        console.warn(`[removeCollectionItemImage] Storage file cleanup note:`, err)
      }
    }
  }

  const updatePayload: Record<string, unknown> = {}
  if (slot === 1) {
    updatePayload.image_url = null
    updatePayload.image_path = null
    if (Array.isArray(existing?.images)) {
      updatePayload.images = existing.images.slice(1)
    }
  } else {
    updatePayload.detail_url = null
    if (Array.isArray(existing?.images)) {
      updatePayload.images = existing.images.slice(0, 1)
    }
  }

  const data = await safeUpdate(adminClient, tableName, id, updatePayload)
  revalidateAllCollectionPages()
  return normalizeCollectionItem(data)
}
