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

  return (data || []) as CollectionItem[]
}

export interface CreateCollectionItemInput {
  title: string
  subtitle_badge?: string | null
  description?: string | null
  image_url: string
  image_path?: string | null
  detail_url?: string | null
  sort_order?: number
  is_published?: boolean
  saree_code?: string | null
}

/**
 * Create a new collection item.
 */
export async function createCollectionItem(
  type: CollectionType,
  input: CreateCollectionItemInput
): Promise<CollectionItem> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  const insertPayload: Record<string, unknown> = {
    title: input.title.trim(),
    subtitle_badge: input.subtitle_badge?.trim() || null,
    description: input.description?.trim() || null,
    image_url: input.image_url.trim(),
    image_path: input.image_path?.trim() || null,
    detail_url: input.detail_url?.trim() || null,
    sort_order: input.sort_order ?? 0,
    is_published: input.is_published ?? true,
  }
  if (type === 'saree' && input.saree_code !== undefined) {
    insertPayload.saree_code = input.saree_code?.trim() || null
  }

  const { data, error } = await adminClient
    .from(tableName)
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error(`[createCollectionItem] Error inserting into ${tableName}:`, error.message)
    throw new Error(error.message)
  }

  revalidateAllCollectionPages()
  return data as CollectionItem
}

export interface UpdateCollectionItemInput {
  title?: string
  subtitle_badge?: string | null
  description?: string | null
  image_url?: string
  image_path?: string | null
  detail_url?: string | null
  sort_order?: number
  is_published?: boolean
  saree_code?: string | null
}

/**
 * Update an existing collection item, safely cleaning up the old storage image if replaced.
 */
export async function updateCollectionItem(
  type: CollectionType,
  id: string,
  input: UpdateCollectionItemInput
): Promise<CollectionItem> {
  await assertAdmin()
  const adminClient = await createAdminClient()
  const tableName = getTableName(type)

  // If replacing image, fetch previous image_path to delete old file
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
  if (input.detail_url !== undefined) updatePayload.detail_url = input.detail_url?.trim() || null
  if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order
  if (input.is_published !== undefined) updatePayload.is_published = input.is_published
  if (type === 'saree' && input.saree_code !== undefined) {
    updatePayload.saree_code = input.saree_code?.trim() || null
  }

  const { data, error } = await adminClient
    .from(tableName)
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`[updateCollectionItem] Error updating ${tableName}:`, error.message)
    throw new Error(error.message)
  }

  revalidateAllCollectionPages()
  return data as CollectionItem
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
 * Enforces file size <= 5MB and allowed mime types (jpeg, png, webp).
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
  id: string
): Promise<CollectionItem> {
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
      console.warn(`[removeCollectionItemImage] Storage file cleanup note:`, err)
    }
  }

  const { data, error } = await adminClient
    .from(tableName)
    .update({ image_url: null, image_path: null })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`[removeCollectionItemImage] Error clearing image in ${tableName}:`, error.message)
    throw new Error(error.message)
  }

  revalidateAllCollectionPages()
  return data as CollectionItem
}
