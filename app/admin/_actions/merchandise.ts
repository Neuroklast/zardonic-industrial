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

export async function createMerchandise(formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('merchandise').insert({
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      external_url: parsed.data.external_url || null,
    })
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create merchandise item.')
}

export async function updateMerchandise(id: string, formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('merchandise')
      .update({
        ...parsed.data,
        image_url: parsed.data.image_url || null,
        external_url: parsed.data.external_url || null,
      })
      .eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath(`/admin/merchandise/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update merchandise item.')
}

export async function deleteMerchandise(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('merchandise').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete merchandise item.')
}

export async function toggleMerchandiseVisibility(id: string, active: boolean) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('merchandise').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update merchandise visibility.')
}
