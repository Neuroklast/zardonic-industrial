'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
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

function parseFormData(formData: FormData) {
  return {
    title: formData.get('title'),
    venue: formData.get('venue') || null,
    city: formData.get('city') || null,
    country: formData.get('country') || null,
    event_date: formData.get('event_date'),
    ticket_url: formData.get('ticket_url') || null,
    festival_name: formData.get('festival_name') || null,
    description: formData.get('description') || null,
  }
}

export async function createGig(formData: FormData) {
  const parsed = gigInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  // Dispatch via registry for AGENTS compliance
  const dispatchResult = dispatchAdminActionAsAdmin('create_gig', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gigs').insert(parsed.data)
    if (error) return { error: error.message }

    revalidatePath('/admin/gigs')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create gig.')
}

export async function updateGig(id: string, formData: FormData) {
  const parsed = gigInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_gig', { ...parsed.data, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gigs').update(parsed.data).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gigs')
    revalidatePath(`/admin/gigs/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update gig.')
}

export async function deleteGig(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('delete_gig', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gigs').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gigs')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete gig.')
}

export async function toggleGigVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_gig', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('gigs').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/gigs')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update gig visibility.')
}
