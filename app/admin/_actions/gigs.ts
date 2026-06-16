'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const gigInputSchema = z.object({
  title: z.string().min(1),
  venue: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  event_date: z.string().min(1),
  ticket_url: z.string().url().optional().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  festival_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function createGig(formData: FormData) {
  const raw = {
    title: formData.get('title'),
    venue: formData.get('venue') || null,
    city: formData.get('city') || null,
    country: formData.get('country') || null,
    event_date: formData.get('event_date'),
    ticket_url: formData.get('ticket_url') || null,
    festival_name: formData.get('festival_name') || null,
    description: formData.get('description') || null,
  }

  const parsed = gigInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('gigs').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/gigs')
  return { success: true }
}

export async function updateGig(id: string, formData: FormData) {
  const raw = {
    title: formData.get('title'),
    venue: formData.get('venue') || null,
    city: formData.get('city') || null,
    country: formData.get('country') || null,
    event_date: formData.get('event_date'),
    ticket_url: formData.get('ticket_url') || null,
    festival_name: formData.get('festival_name') || null,
    description: formData.get('description') || null,
  }

  const parsed = gigInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('gigs').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/gigs')
  revalidatePath(`/admin/gigs/${id}`)
  return { success: true }
}

export async function deleteGig(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gigs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/gigs')
  return { success: true }
}
