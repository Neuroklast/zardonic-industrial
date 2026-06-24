'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'
import { preferR2StoragePath } from '@/lib/r2-image-preference'
import { z } from 'zod'

const partnerCategorySchema = z.enum(['credit', 'endorsement', 'partner', 'label', 'sponsor'])

const partnerInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v)),
  logo_storage_path: z.string().optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v)),
  logo_url: z.string().url().optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v)),
  category: partnerCategorySchema.optional().default('partner'),
  display_order: z.coerce.number().optional().default(0),
  active: z.coerce.boolean().optional(),
  logo_white: z.boolean().default(true),
})

function parseFormData(formData: FormData) {
  return {
    name: formData.get('name'),
    url: formData.get('url') || null,
    logo_storage_path: formData.get('logo_storage_path') || null,
    logo_url: formData.get('logo_url') || null,
    category: formData.get('category') || 'partner',
    display_order: formData.get('display_order') || 0,
    active: formData.get('active'),
    logo_white: formData.has('logo_white'),
  }
}

function withR2LogoPreference<T extends { logo_storage_path?: string | null; logo_url?: string | null }>(
  data: T,
): T {
  return preferR2StoragePath(data, 'logo_storage_path', 'logo_url')
}

export async function createPartner(formData: FormData) {
  const parsed = partnerInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('create_partner', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('partners').insert(withR2LogoPreference(parsed.data))
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create partner.')
}

export async function updatePartner(id: string, formData: FormData) {
  const parsed = partnerInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_partner', { ...parsed.data, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin
      .from('partners')
      .update(withR2LogoPreference(parsed.data))
      .eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update partner.')
}

export async function deletePartner(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('delete_partner', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('partners').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete partner.')
}

export async function togglePartnerVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_partner', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('partners').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update partner visibility.')
}
