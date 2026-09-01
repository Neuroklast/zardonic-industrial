import { fetchOdesliLinksFromApi, cleanAppleMusicUrl } from '@/lib/odesli'
import { parseStreamingLinks } from '@/lib/release-public-mapper'
import { mergeStreamingLinks, type StreamingLink } from '@/lib/release-metadata'
import { normalizeDiscogsId, normalizeItunesId } from '@/lib/release-external-ids'
import { normalizeStreamingPlatform } from '@/lib/streaming-platforms'

export interface ReleaseStreamingRow {
  itunes_id?: string | null
  spotify_id?: string | null
  discogs_id?: string | null
  streaming_links?: unknown
}

function findLinkUrl(links: StreamingLink[], platform: string): string | undefined {
  const canonical = normalizeStreamingPlatform(platform)
  const match = links.find(
    (link) => normalizeStreamingPlatform(link.platform) === canonical,
  )
  return match?.url
}

function findUrlByHost(links: StreamingLink[], hostPattern: RegExp): string | undefined {
  return links.find((link) => hostPattern.test(link.url))?.url
}

/** Build the best URL to pass to Odesli (Apple Music preferred, then Spotify). */
export function buildOdesliLookupUrl(row: ReleaseStreamingRow): string | null {
  const links = parseStreamingLinks(row.streaming_links)

  const appleFromLinks =
    findLinkUrl(links, 'appleMusic') ??
    findUrlByHost(links, /music\.apple\.com/i)
  if (appleFromLinks) return cleanAppleMusicUrl(appleFromLinks)

  if (row.itunes_id) {
    return `https://music.apple.com/album/id${row.itunes_id}`
  }

  const spotifyFromLinks =
    findLinkUrl(links, 'spotify') ??
    findUrlByHost(links, /open\.spotify\.com/i)
  if (spotifyFromLinks) return spotifyFromLinks

  if (row.spotify_id) {
    return `https://open.spotify.com/album/${row.spotify_id}`
  }

  // Last resort: let Odesli attempt resolution from a Discogs release anchor.
  // Unsupported anchors return an empty link set (harmless, no throw).
  if (row.discogs_id) {
    return `https://www.discogs.com/release/${row.discogs_id}`
  }

  return null
}

export async function fetchOdesliStreamingLinks(row: ReleaseStreamingRow): Promise<StreamingLink[]> {
  const lookupUrl = buildOdesliLookupUrl(row)
  if (!lookupUrl) return []
  const { links } = await fetchOdesliLinksFromApi(lookupUrl)
  return links
}

export function mergeOdesliIntoReleaseLinks(
  existing: unknown,
  odesliLinks: StreamingLink[],
): StreamingLink[] {
  return mergeStreamingLinks(parseStreamingLinks(existing), odesliLinks)
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