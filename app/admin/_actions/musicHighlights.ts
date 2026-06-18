'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  youtube_url: z.string().url(),
  description: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
})

export async function createMusicHighlight(formData: FormData) {
  const raw = {
    title: formData.get('title'),
    youtube_url: formData.get('youtube_url'),
    description: formData.get('description') || null,
    display_order: formData.get('display_order') || 0,
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('music_highlights').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/music-highlights')
  return { success: true }
}

export async function updateMusicHighlight(id: string, formData: FormData) {
  const raw = {
    title: formData.get('title'),
    youtube_url: formData.get('youtube_url'),
    description: formData.get('description') || null,
    display_order: formData.get('display_order') || 0,
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('music_highlights').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/music-highlights')
  revalidatePath(`/admin/music-highlights/${id}`)
  return { success: true }
}

export async function deleteMusicHighlight(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('music_highlights').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/music-highlights')
  return { success: true }
}

export async function toggleMusicHighlightVisibility(id: string, active: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('music_highlights').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/music-highlights')
  return { success: true }
}
