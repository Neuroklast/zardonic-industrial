'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { parseCatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import {
  buildReleaseEnrichmentUpdate,
  releaseNeedsEnrichment,
  type ReleaseEnrichmentRow,
} from '@/lib/release-enrichment'
import { revalidatePath } from 'next/cache'

export interface EnrichReleaseTracksResult {
  ok: boolean
  enriched?: boolean
  source?: string
  trackCount?: number
  platformCount?: number
  error?: string
}

export interface EnrichAllReleasesTracksResult {
  enriched: number
  skipped: number
  errors: string[]
  remaining: number
}

const ENRICHMENT_SELECT =
  'id, title, tracks, manually_edited, spotify_id, discogs_id, itunes_id, tracks_source, last_enriched_at, streaming_links'

async function loadArtistName(): Promise<string> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'catalogue_sync')
    .maybeSingle()
  return parseCatalogueSyncConfig(data?.value).artistName || 'Zardonic'
}

export async function enrichReleaseTracks(
  releaseId: string,
  options?: { force?: boolean },
): Promise<EnrichReleaseTracksResult> {
  const dispatchResult = dispatchAdminActionAsAdmin(
    'enrich_release_tracks',
    { releaseId, force: options?.force ?? false },
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { ok: false, error: dispatchResult.error }

  const actionResult = await runAdminAction(async () => {
    const supabase = createAdminClient()
    const { data: row, error: fetchError } = await supabase
      .from('releases')
      .select(ENRICHMENT_SELECT)
      .eq('id', releaseId)
      .maybeSingle()

    if (fetchError || !row) {
      return { ok: false, error: fetchError?.message ?? 'Release not found' }
    }

    const release = row as ReleaseEnrichmentRow
    if (!options?.force && !releaseNeedsEnrichment(release, options)) {
      return { ok: true, enriched: false }
    }

    const artistName = await loadArtistName()
    const update = await buildReleaseEnrichmentUpdate(release, artistName, options)
    if (!update) {
      return { ok: false, error: 'No tracklist or streaming links found from external APIs' }
    }

    const { error: updateError } = await supabase.from('releases').update(update).eq('id', releaseId)
    if (updateError) return { ok: false, error: updateError.message }

    revalidatePath('/admin/releases')
    revalidatePath(`/admin/releases/${releaseId}`)
    revalidatePath('/')

    const tracks = Array.isArray(update.tracks) ? update.tracks : []
    const links = Array.isArray(update.streaming_links) ? update.streaming_links : []

    return {
      ok: true,
      enriched: true,
      source: typeof update.tracks_source === 'string' ? update.tracks_source : undefined,
      trackCount: tracks.length,
      platformCount: links.length,
    }
  }, 'Unable to enrich release tracklist.')

  if ('error' in actionResult) return { ok: false, error: actionResult.error }
  return actionResult
}

export async function enrichAllReleasesTracks(
  options?: { force?: boolean; limit?: number },
): Promise<EnrichAllReleasesTracksResult | { error: string }> {
  const limit = options?.limit ?? 25

  const dispatchResult = dispatchAdminActionAsAdmin(
    'enrich_all_release_tracks',
    { force: options?.force ?? false, limit },
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const artistName = await loadArtistName()

    const { data: rows, error: listError } = await supabase
      .from('releases')
      .select(ENRICHMENT_SELECT)
      .eq('manually_edited', false)
      .order('display_order', { ascending: true })

    if (listError) return { enriched: 0, skipped: 0, errors: [listError.message], remaining: 0 }

    const candidates = (rows ?? []).filter((row: ReleaseEnrichmentRow) =>
      releaseNeedsEnrichment(row, options),
    )

    const batch = candidates.slice(0, limit)
    const result: EnrichAllReleasesTracksResult = {
      enriched: 0,
      skipped: 0,
      errors: [],
      remaining: Math.max(0, candidates.length - batch.length),
    }

    for (const row of batch) {
      const release = row as ReleaseEnrichmentRow
      const update = await buildReleaseEnrichmentUpdate(release, artistName, options)
      if (!update) {
        result.skipped++
        result.errors.push(`"${release.title}": no data from external APIs`)
        continue
      }

      const { error: updateError } = await supabase.from('releases').update(update).eq('id', release.id)
      if (updateError) {
        result.skipped++
        result.errors.push(`"${release.title}": ${updateError.message}`)
        continue
      }

      result.enriched++
    }

    if (result.enriched > 0) {
      revalidatePath('/admin/releases')
      revalidatePath('/')
    }

    return result
  }, 'Unable to enrich release tracklists.')
}

export async function countReleasesNeedingTrackEnrichment(
  options?: { force?: boolean },
): Promise<{ count: number } | { error: string }> {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { data: rows, error } = await supabase
      .from('releases')
      .select(ENRICHMENT_SELECT)
      .eq('manually_edited', false)

    if (error) return { error: error.message }

    const count = (rows ?? []).filter((row: ReleaseEnrichmentRow) =>
      releaseNeedsEnrichment(row, options),
    ).length

    return { count }
  }, 'Unable to count releases needing track enrichment.')
}