'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { revalidatePath } from 'next/cache'
import { preferR2StoragePath } from '@/lib/r2-image-preference'
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

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('create_merchandise', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const row = preferR2StoragePath(
      {
        ...parsed.data,
        image_url: parsed.data.image_url || null,
        external_url: parsed.data.external_url || null,
      },
      'image_storage_path',
      'image_url',
    )
    const { error } = await supabaseAdmin.from('merchandise').insert(row)
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create merchandise item.')
}

export async function updateMerchandise(id: string, formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('update_merchandise', { ...parsed.data, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const row = preferR2StoragePath(
      {
        ...parsed.data,
        image_url: parsed.data.image_url || null,
        external_url: parsed.data.external_url || null,
      },
      'image_storage_path',
      'image_url',
    )
    const { error } = await supabaseAdmin.from('merchandise').update(row).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath(`/admin/merchandise/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update merchandise item.')
}

export async function deleteMerchandise(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('delete_merchandise', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('merchandise').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete merchandise item.')
}

export async function toggleMerchandiseVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('update_merchandise', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('merchandise').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/merchandise')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update merchandise visibility.')
}
