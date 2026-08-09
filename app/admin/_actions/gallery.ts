'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'
import { preferR2StoragePath } from '@/lib/r2-image-preference'
import { z } from 'zod'

const galleryInputSchema = z.object({
  storage_path: z.string().min(1, 'Please upload or select an image first.'),
  alt: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
})

function friendlyZodError(error: z.ZodError): string {
  const first = error.issues[0]
  if (!first) return 'Invalid form data. Please check the fields and try again.'
  if (first.path[0] === 'storage_path') return 'Please upload or select an image first.'
  if (first.path[0] === 'alt') return 'Alt text must be text (you can leave it empty).'
  if (first.path[0] === 'caption') return 'Caption must be text (you can leave it empty).'
  return first.message || 'Invalid form data. Please check the fields and try again.'
}

function normalizeOptionalText(value: FormDataEntryValue | null): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

export async function saveGalleryImage(formData: FormData) {
  const raw = {
    storage_path: formData.get('storage_path'),
    alt: normalizeOptionalText(formData.get('alt')),
    caption: normalizeOptionalText(formData.get('caption')),
    display_order: formData.get('display_order') || 0,
  }

  const parsed = galleryInputSchema.safeParse(raw)
  if (!parsed.success) return { error: friendlyZodError(parsed.error) }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('create_gallery_item', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) {
    // Prefer human-readable validation messages over raw Zod JSON dumps
    const msg = dispatchResult.error
    if (msg.includes('Invalid input') || msg.includes('invalid_type')) {
      return { error: 'Could not save image. Check that an image is selected; alt and caption are optional.' }
    }
    return { error: msg }
  }

  return runAdminAction(async () => {
    const row = preferR2StoragePath(
      {
        storage_path: parsed.data.storage_path,
        alt: parsed.data.alt ?? '',
        caption: parsed.data.caption ?? '',
        display_order: parsed.data.display_order ?? 0,
        image_url: null,
        active: true,
      },
      'storage_path',
      'image_url',
    )
    const { error } = await supabaseAdmin.from('gallery').insert(row)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    revalidatePath('/', 'layout')
    return { success: true }
  }, 'Unable to save gallery image.')
}

const galleryUpdateSchema = galleryInputSchema.extend({
  image_url: z.string().url().optional().nullable().or(z.literal('')),
})

export async function updateGalleryImage(id: string, formData: FormData) {
  const raw = {
    storage_path: formData.get('storage_path'),
    alt: normalizeOptionalText(formData.get('alt')),
    caption: normalizeOptionalText(formData.get('caption')),
    display_order: formData.get('display_order') || 0,
    image_url: formData.get('image_url') || null,
  }

  const parsed = galleryUpdateSchema.safeParse(raw)
  if (!parsed.success) return { error: friendlyZodError(parsed.error) }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin(
    'update_gallery_item',
    { ...parsed.data, id },
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  const row = preferR2StoragePath(
    {
      ...parsed.data,
      image_url: parsed.data.image_url || null,
    },
    'storage_path',
    'image_url',
  )

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gallery').update(row).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath(`/admin/gallery/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update gallery image.')
}

export async function deleteGalleryImage(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('delete_gallery_item', { id }, createSupabaseActionContext(supabaseAdmin))
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

  const dispatchResult = dispatchAdminActionAsAdmin('update_gallery_visibility', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gallery').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gallery')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update gallery visibility.')
}
