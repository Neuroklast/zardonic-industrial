'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const httpsUrl = z
  .string()
  .url()
  .refine((u) => {
    try {
      const protocol = new URL(u).protocol
      return protocol === 'https:' || protocol === 'http:'
    } catch {
      return false
    }
  }, 'URL must use http or https')

const socialInputSchema = z.object({
  platform: z.string().min(1).max(80),
  url: httpsUrl,
  label: z.string().max(120).optional().nullable(),
  display_order: z.coerce.number().int().min(0).max(10_000).optional().default(0),
  logo_storage_path: z.string().max(500).optional().nullable(),
  logo_url: httpsUrl.optional().nullable().or(z.literal('')),
})

function parseFormData(formData: FormData) {
  return {
    platform: formData.get('platform'),
    url: formData.get('url'),
    label: formData.get('label') || null,
    display_order: formData.get('display_order') || 0,
    logo_storage_path: formData.get('logo_storage_path') || null,
    logo_url: formData.get('logo_url') || null,
  }
}

function toSocialRow(data: z.infer<typeof socialInputSchema>) {
  return {
    platform: data.platform.trim(),
    url: data.url.trim(),
    label: data.label?.trim() || null,
    display_order: data.display_order ?? 0,
    logo_storage_path: data.logo_storage_path?.trim() || null,
    logo_url: data.logo_url?.trim() || null,
  }
}

export async function createSocialLink(formData: FormData) {
  const parsed = socialInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()
  const row = toSocialRow(parsed.data)

  const dispatchResult = dispatchAdminActionAsAdmin('create_social_link', row, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('social_links').insert(row)
    if (error) return { error: error.message }

    revalidatePath('/admin/social')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create social link.')
}

export async function updateSocialLink(id: string, formData: FormData) {
  const parsed = socialInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()
  const row = toSocialRow(parsed.data)

  const dispatchResult = dispatchAdminActionAsAdmin('update_social_link', { ...row, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('social_links').update(row).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/social')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update social link.')
}

export async function deleteSocialLink(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('delete_social_link', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('social_links').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/social')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete social link.')
}

export async function reorderSocialLinks(orderedIds: string[]) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: 'No link ids provided.' }
  }

  const supabaseAdmin = createAdminClient()

  return runAdminAction(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabaseAdmin
        .from('social_links')
        .update({ display_order: i })
        .eq('id', orderedIds[i])
      if (error) return { error: error.message }
    }

    revalidatePath('/admin/social')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to reorder social links.')
}
