'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'
import { fetchNextDisplayOrder } from '@/app/admin/_lib/displayOrder'
import { safeExternalUrl } from '@/lib/safe-external-url'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  youtube_url: safeExternalUrl,
  description: z.string().optional().nullable(),
})

function parseFormData(formData: FormData) {
  return {
    title: formData.get('title'),
    youtube_url: formData.get('youtube_url'),
    description: formData.get('description') || null,
  }
}

export async function createMusicHighlight(formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('create_music_highlight', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const nextOrder = await fetchNextDisplayOrder(supabaseAdmin, 'music_highlights')
    const { error } = await supabaseAdmin
      .from('music_highlights')
      .insert({ ...parsed.data, display_order: nextOrder })
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create music highlight.')
}

export async function updateMusicHighlight(id: string, formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_music_highlight', { ...parsed.data, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('music_highlights').update(parsed.data).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath(`/admin/music-highlights/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update music highlight.')
}

export async function deleteMusicHighlight(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('delete_music_highlight', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('music_highlights').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete music highlight.')
}

export async function toggleMusicHighlightVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_music_highlight', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('music_highlights').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update music highlight visibility.')
}
