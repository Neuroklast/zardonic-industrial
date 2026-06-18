'use server'

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

  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/gallery')
  return { success: true }
}

export async function deleteGalleryImage(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gallery')
  return { success: true }
}

export async function toggleGalleryImageVisibility(id: string, visible: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery').update({ visible }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gallery')
  return { success: true }
}
