import type { ReleaseTrackMetadata } from '@/lib/release-metadata'

interface ITunesTrackResult {
  wrapperType?: string
  trackName?: string
  trackNumber?: number
  trackTimeMillis?: number
  artistName?: string
}

function msToTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function splitArtists(str: string): string[] {
  return str
    .split(/\s*,\s*|\s*&\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function parseTrackArtists(
  iTunesArtistName: string,
  mainArtist: string,
): { artist: string; featuredArtists: string[] } {
  if (!iTunesArtistName?.trim()) {
    return { artist: mainArtist, featuredArtists: [] }
  }

  const main = mainArtist.trim().toLowerCase()
  const featMatch = iTunesArtistName.match(/^(.+?)\s+(?:feat\.|ft\.|featuring)\s+(.+)$/i)
  if (!featMatch) {
    return { artist: iTunesArtistName.trim(), featuredArtists: [] }
  }

  const baseArtist = featMatch[1].trim()
  const featuredArtists = splitArtists(featMatch[2].trim()).filter(
    (a) => a.trim().toLowerCase() !== main,
  )

  return { artist: baseArtist, featuredArtists }
}

/** Fetch album/single tracklist from iTunes lookup API. */
export async function fetchItunesTracklist(
  itunesId: string,
  mainArtist: string,
): Promise<ReleaseTrackMetadata[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(itunesId)}&entity=song&sort=trackNumber`,
      { cache: 'no-store' },
    )
    if (!res.ok) return []

    const data = (await res.json()) as { results?: ITunesTrackResult[] }
    const results = data.results ?? []

    return results
      .filter((t) => t.wrapperType === 'track' && t.trackName)
      .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
      .map((t) => {
        const iTunesArtistName = t.artistName ?? ''
        const { artist, featuredArtists } = parseTrackArtists(iTunesArtistName, mainArtist)
        const trackArtist =
          artist.trim().toLowerCase() !== mainArtist.trim().toLowerCase() ? artist : undefined

        return {
          title: t.trackName ?? '',
          duration: t.trackTimeMillis ? msToTime(t.trackTimeMillis) : undefined,
          artist: trackArtist,
          featuredArtists: featuredArtists.length > 0 ? featuredArtists : undefined,
        }
      })
  } catch {
    return []
  }
}