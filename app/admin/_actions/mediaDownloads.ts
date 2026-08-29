'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'
import { preferR2StoragePath } from '@/lib/r2-image-preference'
import { parseMediaCategory, validateMediaUpload } from '@/lib/media-download'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  file_storage_path: z.string().min(1, 'Please upload a file first.'),
  file_url: z.string().url().optional().nullable().or(z.literal('')),
  file_mime: z.string().optional().nullable(),
  file_size_bytes: z.coerce.number().optional().nullable(),
  original_filename: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
})

function normalizeOptionalText(value: FormDataEntryValue | null): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function parseFormData(formData: FormData) {
  const sizeRaw = formData.get('file_size_bytes')
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: normalizeOptionalText(formData.get('description')),
    category: normalizeOptionalText(formData.get('category')),
    file_storage_path: String(formData.get('file_storage_path') ?? '').trim(),
    file_url: normalizeOptionalText(formData.get('file_url')),
    file_mime: normalizeOptionalText(formData.get('file_mime')),
    file_size_bytes: sizeRaw == null || String(sizeRaw).trim() === '' ? null : sizeRaw,
    original_filename: normalizeOptionalText(formData.get('original_filename')),
    display_order: formData.get('display_order') || 0,
  }
}

function toRow(parsed: z.infer<typeof schema>) {
  const filename = parsed.original_filename ?? null
  const mimeCheck = parsed.file_mime
    ? validateMediaUpload(parsed.file_mime, Number(parsed.file_size_bytes ?? 0), filename)
    : { ok: true as const, mime: parsed.file_mime ?? null }

  return preferR2StoragePath(
    {
      title: parsed.title,
      description: parsed.description ?? null,
      category: parseMediaCategory(parsed.category),
      file_storage_path: parsed.file_storage_path,
      file_url: parsed.file_url || null,
      file_mime: mimeCheck.ok && mimeCheck.mime ? mimeCheck.mime : parsed.file_mime || null,
      file_size_bytes: parsed.file_size_bytes ?? null,
      original_filename: filename,
      display_order: parsed.display_order ?? 0,
    },
    'file_storage_path',
    'file_url',
  )
}

export async function createMediaDownload(formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid form data.' }

  const check = validateMediaUpload(
    parsed.data.file_mime,
    Number(parsed.data.file_size_bytes ?? 0),
    parsed.data.original_filename,
  )
  if (!check.ok) return { error: check.error }

  const supabaseAdmin = createAdminClient()
  const dispatchResult = dispatchAdminActionAsAdmin(
    'create_media_download',
    parsed.data,
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('media_downloads').insert({
      ...toRow(parsed.data),
      active: true,
    })
    if (error) return { error: error.message }

    revalidatePath('/admin/media')
    revalidatePath('/')
    revalidatePath('/media')
    return { success: true }
  }, 'Unable to create media download.')
}

export async function updateMediaDownload(id: string, formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid form data.' }

  const check = validateMediaUpload(
    parsed.data.file_mime,
    Number(parsed.data.file_size_bytes ?? 0),
    parsed.data.original_filename,
  )
  if (!check.ok) return { error: check.error }

  const supabaseAdmin = createAdminClient()
  const dispatchResult = dispatchAdminActionAsAdmin(
    'update_media_download',
    { ...parsed.data, id },
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('media_downloads').update(toRow(parsed.data)).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/media')
    revalidatePath(`/admin/media/${id}`)
    revalidatePath('/')
    revalidatePath('/media')
    return { success: true }
  }, 'Unable to update media download.')
}

export async function deleteMediaDownload(id: string) {
  const supabaseAdmin = createAdminClient()
  const dispatchResult = dispatchAdminActionAsAdmin(
    'delete_media_download',
    { id },
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('media_downloads').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/media')
    revalidatePath('/')
    revalidatePath('/media')
    return { success: true }
  }, 'Unable to delete media download.')
}

export async function toggleMediaDownloadVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()
  const dispatchResult = dispatchAdminActionAsAdmin(
    'update_media_download_visibility',
    { id, active },
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('media_downloads').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/media')
    revalidatePath('/')
    revalidatePath('/media')
    return { success: true }
  }, 'Unable to update media download visibility.')
}
