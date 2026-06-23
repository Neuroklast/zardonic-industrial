'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const galleryInputSchema = z.object({
  storage_path: z.string().min(1),
  alt: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
})

export async function saveGalleryImage(formData: FormData) {
  const raw = {
    storage_path: formData.get('storage_path'),
    alt: formData.get('alt') || null,
    caption: formData.get('caption') || null,
    display_order: formData.get('display_order') || 0,
  }

  const parsed = galleryInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('create_gallery_item', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gallery').insert(parsed.data)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to save gallery image.')
}

export async function deleteGalleryImage(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('delete_gallery_item', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gallery').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete gallery image.')
}

export async function toggleGalleryImageVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('update_gallery_visibility', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gallery').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update gallery visibility.')
}
