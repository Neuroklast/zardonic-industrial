'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const socialInputSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
  label: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
})

function parseFormData(formData: FormData) {
  return {
    platform: formData.get('platform'),
    url: formData.get('url'),
    label: formData.get('label') || null,
    display_order: formData.get('display_order') || 0,
  }
}

export async function createSocialLink(formData: FormData) {
  const parsed = socialInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('create_social_link', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('social_links').insert(parsed.data)
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

  const dispatchResult = dispatchAdminAction('update_social_link', { ...parsed.data, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('social_links').update(parsed.data).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/social')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update social link.')
}

export async function deleteSocialLink(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('delete_social_link', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('social_links').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/social')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete social link.')
}
