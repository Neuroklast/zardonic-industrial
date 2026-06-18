'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
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

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('gallery').insert(parsed.data)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to save gallery image.')
}

export async function deleteGalleryImage(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('gallery').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete gallery image.')
}

export async function toggleGalleryImageVisibility(id: string, active: boolean) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('gallery').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update gallery visibility.')
}
