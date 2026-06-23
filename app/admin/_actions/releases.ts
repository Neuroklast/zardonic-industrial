'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { revalidatePath } from 'next/cache'
import { preferR2StoragePath } from '@/lib/r2-image-preference'
import { normalizeDiscogsId, normalizeItunesId, normalizeSpotifyId } from '@/lib/release-external-ids'
import { parseReleaseTracks } from '@/lib/release-public-mapper'
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
  itunes_id: z.string().optional().nullable(),
  spotify_id: z.string().optional().nullable(),
  discogs_id: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
  tracks: z.string().optional(),
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
    itunes_id: formData.get('itunes_id') || null,
    spotify_id: formData.get('spotify_id') || null,
    discogs_id: formData.get('discogs_id') || null,
    display_order: formData.get('display_order'),
    tracks: formData.get('tracks'),
  }
}

function parseTracksField(tracks: string | undefined) {
  if (!tracks || typeof tracks !== 'string' || !tracks.trim()) return []
  try {
    return parseReleaseTracks(JSON.parse(tracks))
  } catch {
    return null
  }
}

function parseOptionalExternalId(
  value: string | null | undefined,
  normalize: (input: string) => string | null,
): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return normalize(trimmed) ?? trimmed
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

  const tracks = parseTracksField(parsed.data.tracks)
  if (tracks === null) return { error: 'Tracklist must be valid JSON' }

  const supabaseAdmin = createAdminClient()

  // Route through registry for AGENTS §12 compliance (validation + dispatch audit trail)
  const dispatchResult = dispatchAdminAction('create_release', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const row = preferR2StoragePath(parsed.data, 'cover_storage_path', 'cover_url')
    const { error } = await supabaseAdmin.from('releases').insert({
      ...row,
      streaming_links: parseStreamingLinks(parsed.data.streaming_links),
      artists: parseArtists(parsed.data.artists),
      itunes_id: parseOptionalExternalId(parsed.data.itunes_id, normalizeItunesId),
      spotify_id: parseOptionalExternalId(parsed.data.spotify_id, normalizeSpotifyId),
      discogs_id: parseOptionalExternalId(parsed.data.discogs_id, normalizeDiscogsId),
      tracks,
      manually_edited: true, // protect user edits from future enrichment/sync
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

  const tracks = parseTracksField(parsed.data.tracks)
  if (tracks === null) return { error: 'Tracklist must be valid JSON' }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('update_release', { ...parsed.data, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const row = preferR2StoragePath(parsed.data, 'cover_storage_path', 'cover_url')
    const { error } = await supabaseAdmin
      .from('releases')
      .update({
        ...row,
        streaming_links: parseStreamingLinks(parsed.data.streaming_links),
        artists: parseArtists(parsed.data.artists),
        itunes_id: parseOptionalExternalId(parsed.data.itunes_id, normalizeItunesId),
        spotify_id: parseOptionalExternalId(parsed.data.spotify_id, normalizeSpotifyId),
        discogs_id: parseOptionalExternalId(parsed.data.discogs_id, normalizeDiscogsId),
        tracks,
        manually_edited: true, // protect user edits from future enrichment/sync
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
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('delete_release', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('releases').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete release.')
}

export async function toggleReleaseVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('update_release', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('releases').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update release visibility.')
}
