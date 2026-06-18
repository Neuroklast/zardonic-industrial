'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
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

function parseFormData(formData: FormData) {
  return {
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
}

function parseStreamingLinks(streamingLinks: string | undefined) {
  return streamingLinks ? JSON.parse(streamingLinks) : []
}

function parseArtists(artists: string | undefined) {
  return artists ? artists.split(',').map((artist: string) => artist.trim()).filter(Boolean) : []
}

export async function createRelease(formData: FormData) {
  const parsed = releaseInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('releases').insert({
      ...parsed.data,
      streaming_links: parseStreamingLinks(parsed.data.streaming_links),
      artists: parseArtists(parsed.data.artists),
    })

    if (error) return { error: error.message }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create release.')
}

export async function updateRelease(id: string, formData: FormData) {
  const parsed = releaseInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('releases')
      .update({
        ...parsed.data,
        streaming_links: parseStreamingLinks(parsed.data.streaming_links),
        artists: parseArtists(parsed.data.artists),
      })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/releases')
    revalidatePath(`/admin/releases/${id}`)
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update release.')
}

export async function deleteRelease(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('releases').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete release.')
}

export async function toggleReleaseVisibility(id: string, active: boolean) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('releases').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update release visibility.')
}
