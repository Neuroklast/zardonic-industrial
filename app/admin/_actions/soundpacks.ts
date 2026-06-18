'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  image_storage_path: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  external_url: z.string().url().optional().nullable().or(z.literal('')),
  display_order: z.coerce.number().optional().default(0),
})

function parseFormData(formData: FormData) {
  return {
    title: formData.get('title'),
    image_storage_path: formData.get('image_storage_path') || null,
    image_url: formData.get('image_url') || null,
    external_url: formData.get('external_url') || null,
    display_order: formData.get('display_order') || 0,
  }
}

export async function createSoundpack(formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('soundpacks').insert({
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      external_url: parsed.data.external_url || null,
    })
    if (error) return { error: error.message }

    revalidatePath('/admin/soundpacks')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create soundpack.')
}

export async function updateSoundpack(id: string, formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('soundpacks')
      .update({
        ...parsed.data,
        image_url: parsed.data.image_url || null,
        external_url: parsed.data.external_url || null,
      })
      .eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/soundpacks')
    revalidatePath(`/admin/soundpacks/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update soundpack.')
}

export async function deleteSoundpack(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('soundpacks').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/soundpacks')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete soundpack.')
}

export async function toggleSoundpackVisibility(id: string, active: boolean) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('soundpacks').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/soundpacks')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update soundpack visibility.')
}
