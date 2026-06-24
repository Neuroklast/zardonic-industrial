import { fetchOdesliLinksFromApi, cleanAppleMusicUrl } from '@/lib/odesli'
import { parseStreamingLinks } from '@/lib/release-public-mapper'
import { mergeStreamingLinks, type StreamingLink } from '@/lib/release-metadata'

export interface ReleaseStreamingRow {
  itunes_id?: string | null
  spotify_id?: string | null
  streaming_links?: unknown
}

/** Build the best URL to pass to Odesli (Apple Music preferred, then Spotify). */
export function buildOdesliLookupUrl(row: ReleaseStreamingRow): string | null {
  const links = parseStreamingLinks(row.streaming_links)

  const appleFromLinks = links.find((l) => l.platform === 'appleMusic')?.url
  if (appleFromLinks) return cleanAppleMusicUrl(appleFromLinks)

  if (row.itunes_id) {
    return `https://music.apple.com/album/id${row.itunes_id}`
  }

  const spotifyFromLinks = links.find((l) => l.platform === 'spotify')?.url
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