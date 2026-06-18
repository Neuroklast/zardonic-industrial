'use server'

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

export async function createPartner(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    url: formData.get('url') || null,
    logo_storage_path: formData.get('logo_storage_path') || null,
    category: formData.get('category') || 'partner',
    display_order: formData.get('display_order') || 0,
  }

  const parsed = partnerInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  return { success: true }
}

export async function updatePartner(id: string, formData: FormData) {
  const raw = {
    name: formData.get('name'),
    url: formData.get('url') || null,
    logo_storage_path: formData.get('logo_storage_path') || null,
    category: formData.get('category') || 'partner',
    display_order: formData.get('display_order') || 0,
  }

  const parsed = partnerInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  return { success: true }
}

export async function deletePartner(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/partners')
  return { success: true }
}

export async function togglePartnerVisibility(id: string, visible: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('partners').update({ visible }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/partners')
  return { success: true }
}
