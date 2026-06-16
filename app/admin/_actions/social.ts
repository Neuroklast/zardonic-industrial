'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const socialInputSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
  label: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
})

export async function createSocialLink(formData: FormData) {
  const raw = {
    platform: formData.get('platform'),
    url: formData.get('url'),
    label: formData.get('label') || null,
    display_order: formData.get('display_order') || 0,
  }

  const parsed = socialInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('social_links').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/social')
  return { success: true }
}

export async function updateSocialLink(id: string, formData: FormData) {
  const raw = {
    platform: formData.get('platform'),
    url: formData.get('url'),
    label: formData.get('label') || null,
    display_order: formData.get('display_order') || 0,
  }

  const parsed = socialInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('social_links').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/social')
  return { success: true }
}

export async function deleteSocialLink(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('social_links').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/social')
  return { success: true }
}
