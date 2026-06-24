import { fetchItunesTracklist } from '@/lib/itunes-tracklist'
import { fetchReleaseMetadataFromDiscogs } from '@/lib/discogs-sync'
import {
  fetchOdesliStreamingLinks,
  mergeOdesliIntoReleaseLinks,
  buildOdesliLookupUrl,
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
  if (row.manually_edited) return null

  const update: Record<string, unknown> = {}
  let changed = false

  if (releaseNeedsTrackEnrichment(row, options)) {
    const fetched = await fetchTracksForRelease(row, artistName)
    if (fetched) {
      Object.assign(update, buildTrackEnrichmentUpdate(fetched.tracks, fetched.source))
      changed = true
    }
  }

  if (releaseNeedsStreamingEnrichment(row, options)) {
    const odesliLinks = await fetchOdesliStreamingLinks(row)
    if (odesliLinks.length > 0) {
      update.streaming_links = mergeOdesliIntoReleaseLinks(
        update.streaming_links ?? row.streaming_links,
        odesliLinks,
      )
      update.last_enriched_at = new Date().toISOString()
      changed = true
    }
  }

  return changed ? update : null
}