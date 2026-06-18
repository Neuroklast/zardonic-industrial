'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  youtube_url: z.string().url(),
  description: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
})

function parseFormData(formData: FormData) {
  return {
    title: formData.get('title'),
    youtube_url: formData.get('youtube_url'),
    description: formData.get('description') || null,
    display_order: formData.get('display_order') || 0,
  }
}

export async function createMusicHighlight(formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('music_highlights').insert(parsed.data)
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create music highlight.')
}

export async function updateMusicHighlight(id: string, formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('music_highlights').update(parsed.data).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath(`/admin/music-highlights/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update music highlight.')
}

export async function deleteMusicHighlight(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('music_highlights').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete music highlight.')
}

export async function toggleMusicHighlightVisibility(id: string, active: boolean) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('music_highlights').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/music-highlights')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update music highlight visibility.')
}
