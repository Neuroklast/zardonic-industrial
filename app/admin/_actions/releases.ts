'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const releaseInputSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['album', 'ep', 'single', 'remix', 'compilation']).default('single'),
  release_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  cover_storage_path: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  streaming_links: z.string().optional(),
  artists: z.string().optional(),
  display_order: z.coerce.number().optional().default(0),
})

export async function createRelease(formData: FormData) {
  const raw = {
    title: formData.get('title'),
    type: formData.get('type'),
    release_date: formData.get('release_date') || null,
    description: formData.get('description') || null,
    cover_storage_path: formData.get('cover_storage_path') || null,
    cover_url: formData.get('cover_url') || null,
    streaming_links: formData.get('streaming_links'),
    artists: formData.get('artists'),
    display_order: formData.get('display_order'),
  }

  const parsed = releaseInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase.from('releases').insert({
    ...parsed.data,
    streaming_links: parsed.data.streaming_links
      ? JSON.parse(parsed.data.streaming_links)
      : [],
    artists: parsed.data.artists
      ? parsed.data.artists.split(',').map((a: string) => a.trim()).filter(Boolean)
      : [],
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/releases')
  return { success: true }
}

export async function updateRelease(id: string, formData: FormData) {
  const raw = {
    title: formData.get('title'),
    type: formData.get('type'),
    release_date: formData.get('release_date') || null,
    description: formData.get('description') || null,
    cover_storage_path: formData.get('cover_storage_path') || null,
    cover_url: formData.get('cover_url') || null,
    streaming_links: formData.get('streaming_links'),
    artists: formData.get('artists'),
    display_order: formData.get('display_order'),
  }

  const parsed = releaseInputSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('releases')
    .update({
      ...parsed.data,
      streaming_links: parsed.data.streaming_links
        ? JSON.parse(parsed.data.streaming_links)
        : [],
      artists: parsed.data.artists
        ? parsed.data.artists.split(',').map((a: string) => a.trim()).filter(Boolean)
        : [],
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/releases')
  revalidatePath(`/admin/releases/${id}`)
  return { success: true }
}

export async function deleteRelease(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('releases').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/releases')
  return { success: true }
}
