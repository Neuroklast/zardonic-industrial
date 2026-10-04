import type { StreamingLink } from '@/lib/release-metadata'
import { normalizeDiscogsId, normalizeItunesId } from '@/lib/release-external-ids'
import { normalizeStreamingPlatform } from '@/lib/streaming-platforms'

/**
 * Cross-source external-id extraction from stored streaming links.
 *
 * These links used to be enriched via the Odesli (song.link) API. That
 * integration was removed (the API was shut down), but the id extractors stay
 * useful: they recover platform ids from the native links returned by the
 * Spotify / iTunes / Discogs source APIs, and from manually pasted links.
 */

export interface ReleaseStreamingRow {
  itunes_id?: string | null
  spotify_id?: string | null
  discogs_id?: string | null
  streaming_links?: unknown
}

/**
 * Extract a Spotify ALBUM id from stored streaming links.
 * Only release-level (album/single) entities are accepted — never a track or
 * episode id, which would collide across many releases in `spotify_id`.
 */
export function extractSpotifyAlbumIdFromLinks(links: StreamingLink[]): string | null {
  for (const link of links) {
    if (!link.url) continue
    const isSpotify =
      normalizeStreamingPlatform(link.platform) === 'spotify' || /spotify/i.test(link.url)
    if (!isSpotify) continue
    const id = extractSpotifyAlbumId(link.url)
    if (id) return id
  }
  return null
}

function extractSpotifyAlbumId(url: string): string | null {
  const uri = url.match(/spotify:(?:album|single):([0-9A-Za-z]{22})/i)
  if (uri) return uri[1]
  const path = url.match(/\/(?:album|single)\/([0-9A-Za-z]{22})(?:[/?#]|$)/i)
  return path?.[1] ?? null
}

/** Extract an iTunes/Apple Music album id from stored streaming links. */
export function extractItunesAlbumIdFromLinks(links: StreamingLink[]): string | null {
  for (const link of links) {
    if (!link.url) continue
    const isApple =
      normalizeStreamingPlatform(link.platform) === 'appleMusic' || /music\.apple\.com/i.test(link.url)
    if (!isApple) continue
    const id = normalizeItunesId(link.url)
    if (id) return id
  }
  return null
}

/** Extract a Discogs release id from stored streaming links. */
export function extractDiscogsIdFromLinks(links: StreamingLink[]): string | null {
  for (const link of links) {
    if (!link.url) continue
    const isDiscogs =
      normalizeStreamingPlatform(link.platform) === 'discogs' || /discogs\.com/i.test(link.url)
    if (!isDiscogs) continue
    const id = normalizeDiscogsId(link.url)
    if (id) return id
  }
  return null
}

export interface ExternalIdsFromLinks {
  spotify_id?: string
  itunes_id?: string
  discogs_id?: string
}

/** Fill missing catalogue external ids from merged streaming links. */
export function externalIdsFromStreamingLinks(
  links: StreamingLink[],
  existing?: { spotify_id?: string | null; itunes_id?: string | null; discogs_id?: string | null },
): ExternalIdsFromLinks {
  const result: ExternalIdsFromLinks = {}
  if (!existing?.spotify_id) {
    const spotifyId = extractSpotifyAlbumIdFromLinks(links)
    if (spotifyId) result.spotify_id = spotifyId
  }
  if (!existing?.itunes_id) {
    const itunesId = extractItunesAlbumIdFromLinks(links)
    if (itunesId) result.itunes_id = itunesId
  }
  if (!existing?.discogs_id) {
    const discogsId = extractDiscogsIdFromLinks(links)
    if (discogsId) result.discogs_id = discogsId
  }
  return result
}
