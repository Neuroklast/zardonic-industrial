'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const partnerInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  logo_storage_path: z.string().optional().nullable(),
  category: z.string().optional().default('partner'),
  display_order: z.coerce.number().optional().default(0),
})

function parseFormData(formData: FormData) {
  return {
    name: formData.get('name'),
    url: formData.get('url') || null,
    logo_storage_path: formData.get('logo_storage_path') || null,
    category: formData.get('category') || 'partner',
    display_order: formData.get('display_order') || 0,
  }
}

export async function createPartner(formData: FormData) {
  const parsed = partnerInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('partners').insert(parsed.data)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create partner.')
}

export async function updatePartner(id: string, formData: FormData) {
  const parsed = partnerInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('partners').update(parsed.data).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update partner.')
}

export async function deletePartner(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('partners').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete partner.')
}

export async function togglePartnerVisibility(id: string, visible: boolean) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('partners').update({ visible }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update partner visibility.')
}
