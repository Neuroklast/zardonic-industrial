import { fetchItunesTracklist } from '@/lib/itunes-tracklist'
import { fetchReleaseMetadataFromDiscogs } from '@/lib/discogs-sync'
import type { createAdminClient } from '@/lib/supabaseAdmin'
import type { ReleaseStreamingRow } from '@/lib/release-streaming-enrichment'
import { hasCoverArt } from '@/lib/release-cover-art'
import { cacheReleaseCoverToR2, resolveBestCoverSource } from '@/lib/release-cover-r2'
import { classifyReleaseType } from '@/lib/release-type'
import { fetchReleaseMetadataFromSpotify } from '@/lib/spotify-sync'
import type { ReleaseMetadata, ReleaseTrackMetadata } from '@/lib/release-metadata'

export type TracksSource = 'spotify' | 'discogs' | 'itunes'

export interface ReleaseEnrichmentRow extends ReleaseStreamingRow {
  id: string
  title: string
  type?: string | null
  artists?: string[] | null
  description?: string | null
  tracks: unknown
  manually_edited: boolean | null
  spotify_id: string | null
  discogs_id: string | null
  itunes_id: string | null
  tracks_source: string | null
  last_enriched_at: string | null
  cover_storage_path?: string | null
  cover_url?: string | null
  streaming_links?: unknown
}

/** Fill a release's missing cover (iTunes → Spotify → Discogs) onto R2. */
async function fillMissingReleaseCover(
  release: ReleaseEnrichmentRow,
): Promise<Record<string, unknown> | null> {
  if (release.manually_edited) return null
  if (hasCoverArt(release)) return null
  if (!release.itunes_id && !release.spotify_id && !release.discogs_id) return null

  const best = await resolveBestCoverSource(release)
  if (!best) return null

  const cached = await cacheReleaseCoverToR2(best.url, best.source, best.externalId)
  if (!cached) return null

  return {
    cover_storage_path: cached.cover_storage_path,
    cover_url: cached.cover_url,
  }
}

/** Days after which a non-manual tracklist is considered stale and may be refreshed. */
export const TRACK_ENRICHMENT_STALE_DAYS = 30

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
  prefetchedDiscogsMetadata?: ReleaseMetadata | null,
): Promise<{ tracks: ReleaseTrackMetadata[]; source: TracksSource } | null> {
  if (row.spotify_id) {
    const metadata = await fetchReleaseMetadataFromSpotify(row.spotify_id)
    if (metadata?.tracks && metadata.tracks.length > 0) {
      return { tracks: metadata.tracks, source: 'spotify' }
    }
  }

  if (row.discogs_id) {
    const metadata =
      prefetchedDiscogsMetadata ?? (await fetchReleaseMetadataFromDiscogs(row.discogs_id))
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
  return releaseHasExternalId(row)
}

/**
 * Discogs catalogue imports only carry list-row metadata (title/year/thumb), so
 * `artists` and `description` arrive empty. This flags rows that still need the
 * full release document fetched to backfill them.
 */
export function releaseNeedsDiscogsMetadataBackfill(row: ReleaseEnrichmentRow): boolean {
  if (row.manually_edited) return false
  if (!row.discogs_id) return false
  return (row.artists ?? []).length === 0 || !row.description?.trim()
}

export function releaseNeedsEnrichment(
  row: ReleaseEnrichmentRow,
  options?: { force?: boolean },
): boolean {
  if (!releaseCanBeAutoEnriched(row)) return false
  return (
    releaseNeedsTrackEnrichment(row, options) ||
    releaseNeedsDiscogsMetadataBackfill(row)
  )
}

/** Fetch tracklists for a non-manual release (cover art backfill is separate). */
export async function buildReleaseEnrichmentUpdate(
  row: ReleaseEnrichmentRow,
  artistName: string,
  options?: { force?: boolean },
): Promise<Record<string, unknown> | null> {
  if (row.manually_edited && !options?.force) return null

  const update: Record<string, unknown> = {}
  let changed = false

  // Discogs list imports omit artists/description — fetch the full release once
  // and reuse it below so tracks do not trigger a second request.
  let discogsMetadata: ReleaseMetadata | null = null
  if (row.discogs_id && releaseNeedsDiscogsMetadataBackfill(row)) {
    discogsMetadata = await fetchReleaseMetadataFromDiscogs(row.discogs_id)
    if (discogsMetadata) {
      if ((row.artists ?? []).length === 0 && discogsMetadata.artists.length > 0) {
        update.artists = discogsMetadata.artists
        changed = true
      }
      if (!row.description?.trim() && discogsMetadata.description?.trim()) {
        update.description = discogsMetadata.description
        changed = true
      }
    }
  }

  const wantsTracks =
    options?.force && releaseHasExternalId(row)
      ? true
      : releaseNeedsTrackEnrichment(row, options)

  if (wantsTracks) {
    const fetched = await fetchTracksForRelease(row, artistName, discogsMetadata)
    if (fetched) {
      Object.assign(update, buildTrackEnrichmentUpdate(fetched.tracks, fetched.source))
      changed = true

      // Re-derive the type now that per-track artist credits exist: a long
      // release with a shared artist is an album, a various-artists one is
      // "Appears On" (compilation).
      const resolvedArtists: string[] = Array.isArray(update.artists)
        ? update.artists.filter((name): name is string => typeof name === 'string')
        : (row.artists ?? [])
      const nextType = classifyReleaseType({
        title: row.title,
        trackCount: fetched.tracks.length,
        trackArtists: fetched.tracks.map((track) =>
          [track.artist, ...(track.featuredArtists ?? [])].filter(Boolean).join(', '),
        ),
        primaryArtist: resolvedArtists[0] ?? null,
      })
      if (nextType !== row.type) update.type = nextType
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

/** Enrich a batch of releases with missing tracklists + cover art (post-catalogue-sync). */
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
      'id, title, type, artists, description, tracks, manually_edited, spotify_id, discogs_id, itunes_id, tracks_source, last_enriched_at, cover_storage_path, cover_url, streaming_links',
    )
    .eq('manually_edited', false)
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })

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

  // Cursor indexes a STABLE, fully-ordered row list — never a shrinking
  // candidate array. Releases that are already fresh (or not enrichable) are
  // skipped cheaply in place, so the cursor advances monotonically and every
  // release is visited exactly once across ticks.
  const all = (rows ?? []) as ReleaseEnrichmentRow[]
  const slice = all.slice(cursor, cursor + limit)

  let enriched = 0
  let skipped = 0
  const errors: string[] = []

  for (const release of slice) {
    const needsEnrich = releaseNeedsEnrichment(release, { force: options.force })

    let update: Record<string, unknown> | null = null
    if (needsEnrich) {
      update = await buildReleaseEnrichmentUpdate(release, options.artistName, {
        force: options.force,
      })
    }

    // Every sync passes also backfills missing cover art on R2 (idempotent).
    const coverUpdate = await fillMissingReleaseCover(release)
    if (coverUpdate) {
      update = { ...(update ?? {}), ...coverUpdate }
    }

    if (!update) {
      if (needsEnrich) {
        skipped++
        errors.push(`"${release.title}": no enrichment data from APIs`)
      }
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

  const nextCursor = cursor + slice.length
  return {
    enriched,
    skipped,
    errors,
    nextCursor,
    total: all.length,
    done: nextCursor >= all.length,
  }
}

/** Run tracklist enrichment until all catalogue candidates are processed. */
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
    errors.unshift(`Tracklist enrichment updated ${enriched} release(s)`)
  }

  return { enriched, skipped, errors }
}