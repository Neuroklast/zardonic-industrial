import { fetchItunesTracklist } from '@/lib/itunes-tracklist'
import { fetchReleaseMetadataFromDiscogs } from '@/lib/discogs-sync'
import type { createAdminClient } from '@/lib/supabaseAdmin'
import {
  fetchOdesliStreamingLinks,
  mergeOdesliIntoReleaseLinks,
  buildOdesliLookupUrl,
  externalIdsFromStreamingLinks,
  type ReleaseStreamingRow,
} from '@/lib/release-streaming-enrichment'
import { parseStreamingLinks } from '@/lib/release-public-mapper'
import { fetchReleaseMetadataFromSpotify } from '@/lib/spotify-sync'
import type { ReleaseTrackMetadata } from '@/lib/release-metadata'

export type TracksSource = 'spotify' | 'discogs' | 'itunes'

export interface ReleaseEnrichmentRow extends ReleaseStreamingRow {
  id: string
  title: string
  tracks: unknown
  manually_edited: boolean | null
  spotify_id: string | null
  discogs_id: string | null
  itunes_id: string | null
  tracks_source: string | null
  last_enriched_at: string | null
  streaming_links?: unknown
}

/** Days after which a non-manual tracklist is considered stale and may be refreshed. */
export const TRACK_ENRICHMENT_STALE_DAYS = 30

/** Re-fetch Odesli links when fewer than this many platforms are stored. */
export const MIN_STREAMING_PLATFORMS = 3

export function releaseTracksAreEmpty(tracks: unknown): boolean {
  return !Array.isArray(tracks) || tracks.length === 0
}

export function releaseHasExternalId(row: ReleaseEnrichmentRow): boolean {
  return Boolean(row.spotify_id || row.discogs_id || row.itunes_id)
}

function isStaleEnrichment(lastEnrichedAt: string | null): boolean {
  if (!lastEnrichedAt) return true
  const enrichedMs = Date.parse(lastEnrichedAt)
  if (!Number.isFinite(enrichedMs)) return true
  const staleMs = TRACK_ENRICHMENT_STALE_DAYS * 24 * 60 * 60 * 1000
  return Date.now() - enrichedMs > staleMs
}

export function releaseNeedsTrackEnrichment(
  row: ReleaseEnrichmentRow,
  options?: { force?: boolean },
): boolean {
  if (row.manually_edited) return false
  if (!releaseHasExternalId(row)) return false

  if (options?.force) return true
  if (releaseTracksAreEmpty(row.tracks)) return true
  return isStaleEnrichment(row.last_enriched_at)
}

export async function fetchTracksForRelease(
  row: ReleaseEnrichmentRow,
  artistName: string,
): Promise<{ tracks: ReleaseTrackMetadata[]; source: TracksSource } | null> {
  if (row.spotify_id) {
    const metadata = await fetchReleaseMetadataFromSpotify(row.spotify_id)
    if (metadata?.tracks && metadata.tracks.length > 0) {
      return { tracks: metadata.tracks, source: 'spotify' }
    }
  }

  if (row.discogs_id) {
    const metadata = await fetchReleaseMetadataFromDiscogs(row.discogs_id)
    if (metadata?.tracks && metadata.tracks.length > 0) {
      return { tracks: metadata.tracks, source: 'discogs' }
    }
  }

  if (row.itunes_id) {
    const tracks = await fetchItunesTracklist(row.itunes_id, artistName)
    if (tracks.length > 0) {
      return { tracks, source: 'itunes' }
    }
  }

  return null
}

export function buildTrackEnrichmentUpdate(
  tracks: ReleaseTrackMetadata[],
  source: TracksSource,
): Record<string, unknown> {
  return {
    tracks,
    tracks_source: source,
    last_enriched_at: new Date().toISOString(),
    manually_edited: false,
  }
}

export function releaseCanBeAutoEnriched(row: ReleaseEnrichmentRow): boolean {
  if (row.manually_edited) return false
  return releaseHasExternalId(row) || buildOdesliLookupUrl(row) !== null
}

export function releaseNeedsStreamingEnrichment(
  row: ReleaseEnrichmentRow,
  options?: { force?: boolean },
): boolean {
  if (row.manually_edited) return false
  if (!buildOdesliLookupUrl(row)) return false
  if (options?.force) return true

  const linkCount = parseStreamingLinks(row.streaming_links).length
  if (linkCount < MIN_STREAMING_PLATFORMS) return true
  return isStaleEnrichment(row.last_enriched_at)
}

export function releaseNeedsEnrichment(
  row: ReleaseEnrichmentRow,
  options?: { force?: boolean },
): boolean {
  if (!releaseCanBeAutoEnriched(row)) return false
  return releaseNeedsTrackEnrichment(row, options) || releaseNeedsStreamingEnrichment(row, options)
}

/** Fetch tracklists + Odesli platform links for a non-manual release. */
export async function buildReleaseEnrichmentUpdate(
  row: ReleaseEnrichmentRow,
  artistName: string,
  options?: { force?: boolean },
): Promise<Record<string, unknown> | null> {
  if (row.manually_edited && !options?.force) return null

  const update: Record<string, unknown> = {}
  let changed = false

  const wantsTracks =
    options?.force && releaseHasExternalId(row)
      ? true
      : releaseNeedsTrackEnrichment(row, options)

  if (wantsTracks) {
    const fetched = await fetchTracksForRelease(row, artistName)
    if (fetched) {
      Object.assign(update, buildTrackEnrichmentUpdate(fetched.tracks, fetched.source))
      changed = true
    }
  }

  const wantsStreaming =
    options?.force && buildOdesliLookupUrl(row) !== null
      ? true
      : releaseNeedsStreamingEnrichment(row, options)

  if (wantsStreaming) {
    const odesliLinks = await fetchOdesliStreamingLinks(row)
    if (odesliLinks.length > 0) {
      const mergedLinks = mergeOdesliIntoReleaseLinks(
        update.streaming_links ?? row.streaming_links,
        odesliLinks,
      )
      update.streaming_links = mergedLinks
      const linkedIds = externalIdsFromStreamingLinks(parseStreamingLinks(mergedLinks), row)
      if (linkedIds.spotify_id && !row.spotify_id) update.spotify_id = linkedIds.spotify_id
      if (linkedIds.itunes_id && !row.itunes_id) update.itunes_id = linkedIds.itunes_id
      if (linkedIds.discogs_id && !row.discogs_id) update.discogs_id = linkedIds.discogs_id
      update.last_enriched_at = new Date().toISOString()
      changed = true
    }
  }

  return changed ? update : null
}

export interface CatalogueEnrichmentBatchResult {
  enriched: number
  skipped: number
  errors: string[]
  nextCursor: number
  total: number
  done: boolean
}

const DEFAULT_ENRICH_BATCH_SIZE = 5

/** Enrich a batch of releases with Odesli links and missing tracklists (post-catalogue-sync). */
export async function runCatalogueEnrichmentBatch(
  supabase: ReturnType<typeof createAdminClient>,
  options: {
    artistName: string
    cursor?: number
    limit?: number
    force?: boolean
  },
): Promise<CatalogueEnrichmentBatchResult> {
  const cursor = options.cursor ?? 0
  const limit = options.limit ?? DEFAULT_ENRICH_BATCH_SIZE

  const { data: rows, error: listError } = await supabase
    .from('releases')
    .select(
      'id, title, tracks, manually_edited, spotify_id, discogs_id, itunes_id, tracks_source, last_enriched_at, streaming_links',
    )
    .eq('manually_edited', false)
    .order('display_order', { ascending: true })

  if (listError) {
    return {
      enriched: 0,
      skipped: 0,
      errors: [listError.message],
      nextCursor: cursor,
      total: 0,
      done: true,
    }
  }

  const candidates = (rows ?? []).filter((row: ReleaseEnrichmentRow) =>
    releaseNeedsEnrichment(row, { force: options.force }),
  )
  const batch = candidates.slice(cursor, cursor + limit)

  let enriched = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of batch) {
    const release = row as ReleaseEnrichmentRow
    const update = await buildReleaseEnrichmentUpdate(release, options.artistName, {
      force: options.force,
    })
    if (!update) {
      skipped++
      errors.push(`"${release.title}": no enrichment data from APIs`)
      continue
    }

    const { error: updateError } = await supabase.from('releases').update(update).eq('id', release.id)
    if (updateError) {
      skipped++
      errors.push(`"${release.title}": ${updateError.message}`)
      continue
    }
    enriched++
  }

  const nextCursor = cursor + batch.length
  return {
    enriched,
    skipped,
    errors,
    nextCursor,
    total: candidates.length,
    done: nextCursor >= candidates.length,
  }
}

/** Run Odesli + tracklist enrichment until all catalogue candidates are processed. */
export async function runFullCatalogueEnrichment(
  supabase: ReturnType<typeof createAdminClient>,
  artistName: string,
  options?: { batchSize?: number; maxBatches?: number },
): Promise<{ enriched: number; skipped: number; errors: string[] }> {
  const batchSize = options?.batchSize ?? DEFAULT_ENRICH_BATCH_SIZE
  const maxBatches = options?.maxBatches ?? 40
  let cursor = 0
  let enriched = 0
  let skipped = 0
  const errors: string[] = []

  for (let batch = 0; batch < maxBatches; batch++) {
    const result = await runCatalogueEnrichmentBatch(supabase, {
      artistName,
      cursor,
      limit: batchSize,
    })
    enriched += result.enriched
    skipped += result.skipped
    errors.push(...result.errors)
    cursor = result.nextCursor
    if (result.done) break
  }

  if (enriched > 0) {
    errors.unshift(`Odesli/streaming enrichment updated ${enriched} release(s)`)
  }

  return { enriched, skipped, errors }
}