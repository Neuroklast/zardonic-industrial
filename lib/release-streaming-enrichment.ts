import { fetchOdesliLinksFromApi, cleanAppleMusicUrl } from '@/lib/odesli'
import { parseStreamingLinks } from '@/lib/release-public-mapper'
import { mergeStreamingLinks, type StreamingLink } from '@/lib/release-metadata'
import { normalizeStreamingPlatform } from '@/lib/streaming-platforms'

export interface ReleaseStreamingRow {
  itunes_id?: string | null
  spotify_id?: string | null
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