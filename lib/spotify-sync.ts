import { getSpotifyAccessToken } from '@/lib/spotify-client'
import { normalizeReleaseDateForDb } from '@/lib/normalize-release-date'
import {
  inferReleaseTypeFromTitle,
  type ReleaseMetadata,
  type ReleaseTrackMetadata,
} from '@/lib/release-metadata'

interface SpotifyImage {
  url?: string
  height?: number
}

interface SpotifyArtistRef {
  name?: string
}

interface SpotifyTrackItem {
  name?: string
  duration_ms?: number
  artists?: SpotifyArtistRef[]
}

interface SpotifyAlbumTracksPage {
  items?: SpotifyTrackItem[]
  next?: string | null
}

interface SpotifyAlbumPayload {
  id?: string
  name?: string
  album_type?: string
  release_date?: string
  images?: SpotifyImage[]
  artists?: SpotifyArtistRef[]
  external_urls?: { spotify?: string }
  tracks?: SpotifyAlbumTracksPage
}

interface SpotifyTrackPayload {
  id?: string
  name?: string
  artists?: SpotifyArtistRef[]
  external_urls?: { spotify?: string }
  album?: SpotifyAlbumPayload
}

function mapSpotifyAlbumType(albumType: string | undefined, title: string): ReleaseMetadata['type'] {
  const normalized = (albumType ?? '').toLowerCase()
  if (normalized === 'single') return 'single'
  if (normalized === 'compilation') return 'compilation'
  return inferReleaseTypeFromTitle(title)
}

function pickLargestImage(images: SpotifyImage[] | undefined): string | null {
  if (!images?.length) return null
  const sorted = [...images].sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
  return sorted[0]?.url ?? null
}

function formatSpotifyDuration(durationMs: number | undefined): string | undefined {
  if (!durationMs || durationMs <= 0) return undefined
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function parseSpotifyTrackItems(items: SpotifyTrackItem[] | undefined): ReleaseTrackMetadata[] {
  if (!items?.length) return []
  const tracks: ReleaseTrackMetadata[] = []

  for (const item of items) {
    const title = item.name?.trim()
    if (!title) continue
    const artistNames = (item.artists ?? [])
      .map((artist) => artist.name?.trim())
      .filter((name): name is string => Boolean(name))
    const track: ReleaseTrackMetadata = { title }
    const duration = formatSpotifyDuration(item.duration_ms)
    if (duration) track.duration = duration
    if (artistNames.length > 0) track.artist = artistNames.join(', ')
    tracks.push(track)
  }

  return tracks
}

async function fetchAllSpotifyAlbumTracks(
  albumId: string,
  headers: Record<string, string>,
  initialPage?: SpotifyAlbumTracksPage,
): Promise<ReleaseTrackMetadata[]> {
  const collected: SpotifyTrackItem[] = [...(initialPage?.items ?? [])]
  let nextUrl = initialPage?.next ?? null

  while (nextUrl) {
    const res = await fetch(nextUrl, { headers, cache: 'no-store' })
    if (!res.ok) break
    const page = (await res.json()) as SpotifyAlbumTracksPage
    collected.push(...(page.items ?? []))
    nextUrl = page.next ?? null
  }

  if (collected.length === 0 && !initialPage) {
    const res = await fetch(
      `https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}/tracks?limit=50`,
      { headers, cache: 'no-store' },
    )
    if (res.ok) {
      const page = (await res.json()) as SpotifyAlbumTracksPage
      collected.push(...(page.items ?? []))
      nextUrl = page.next ?? null
      while (nextUrl) {
        const pageRes = await fetch(nextUrl, { headers, cache: 'no-store' })
        if (!pageRes.ok) break
        const nextPage = (await pageRes.json()) as SpotifyAlbumTracksPage
        collected.push(...(nextPage.items ?? []))
        nextUrl = nextPage.next ?? null
      }
    }
  }

  return parseSpotifyTrackItems(collected)
}

function parseSpotifyAlbum(
  data: SpotifyAlbumPayload,
  tracks: ReleaseTrackMetadata[] = [],
): ReleaseMetadata | null {
  const title = data.name?.trim()
  const spotifyId = data.id
  if (!title || !spotifyId) return null

  const artists = (data.artists ?? []).map((a) => a.name?.trim()).filter((n): n is string => Boolean(n))
  const spotifyUrl = data.external_urls?.spotify ?? `https://open.spotify.com/album/${spotifyId}`

  return {
    title,
    type: mapSpotifyAlbumType(data.album_type, title),
    release_date: normalizeReleaseDateForDb(data.release_date),
    description: null,
    artists,
    coverUrl: pickLargestImage(data.images),
    streaming_links: [{ platform: 'spotify', url: spotifyUrl }],
    tracks: tracks.length > 0 ? tracks : undefined,
    spotify_id: spotifyId,
  }
}

function parseSpotifyTrack(data: SpotifyTrackPayload): ReleaseMetadata | null {
  const title = data.name?.trim()
  const spotifyId = data.id
  if (!title || !spotifyId) return null

  const album = data.album
  const artists = (data.artists ?? []).map((a) => a.name?.trim()).filter((n): n is string => Boolean(n))
  const spotifyUrl = data.external_urls?.spotify ?? `https://open.spotify.com/track/${spotifyId}`

  return {
    title,
    type: album ? mapSpotifyAlbumType(album.album_type, title) : 'single',
    release_date: normalizeReleaseDateForDb(album?.release_date),
    description: null,
    artists,
    coverUrl: pickLargestImage(album?.images),
    streaming_links: [{ platform: 'spotify', url: spotifyUrl }],
    spotify_id: spotifyId,
  }
}

export async function fetchReleaseMetadataFromSpotify(spotifyId: string): Promise<ReleaseMetadata | null> {
  const token = await getSpotifyAccessToken()
  if (!token) return null

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

  const albumRes = await fetch(`https://api.spotify.com/v1/albums/${encodeURIComponent(spotifyId)}`, {
    headers,
    cache: 'no-store',
  })
  if (albumRes.ok) {
    const data = (await albumRes.json()) as SpotifyAlbumPayload
    const tracks = await fetchAllSpotifyAlbumTracks(spotifyId, headers, data.tracks)
    return parseSpotifyAlbum(data, tracks)
  }

  if (albumRes.status !== 404) return null

  const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(spotifyId)}`, {
    headers,
    cache: 'no-store',
  })
  if (!trackRes.ok) return null

  const trackData = (await trackRes.json()) as SpotifyTrackPayload
  return parseSpotifyTrack(trackData)
}

export interface SpotifyArtistAlbumItem {
  spotify_id: string
  metadata: ReleaseMetadata
}

export interface SpotifyArtistAlbumsPageResult {
  items: SpotifyArtistAlbumItem[]
  nextUrl: string | null
  ok: boolean
  error?: string
}

async function spotifyApiErrorDetail(res: Response): Promise<string> {
  let detail = `HTTP ${res.status}`
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    if (body.error?.message) detail += `: ${body.error.message}`
  } catch {
    // ignore non-JSON bodies
  }
  return detail
}

/** Fetch one page of Spotify artist albums (for chunked sync jobs). */
export async function fetchSpotifyArtistAlbumsPage(
  artistId: string,
  nextUrl?: string | null,
): Promise<SpotifyArtistAlbumsPageResult> {
  const token = await getSpotifyAccessToken()
  if (!token) {
    return {
      items: [],
      nextUrl: null,
      ok: false,
      error: 'Spotify access token unavailable — check Admin → API Keys (Client ID + Secret)',
    }
  }

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  const url =
    nextUrl ??
    `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}/albums?include_groups=album,single,compilation&limit=50`

  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) {
    const detail = await spotifyApiErrorDetail(res)
    return {
      items: [],
      nextUrl: null,
      ok: false,
      error:
        res.status === 404
          ? `Spotify artist not found (${artistId}) — use an artist ID/URL in Catalogue Sync, not an album or track`
          : `Spotify albums API ${detail}`,
    }
  }

  const data = (await res.json()) as {
    items?: SpotifyAlbumPayload[]
    next?: string | null
  }

  const items: SpotifyArtistAlbumItem[] = []
  for (const album of data.items ?? []) {
    const metadata = parseSpotifyAlbum(album)
    if (metadata?.spotify_id) items.push({ spotify_id: metadata.spotify_id, metadata })
  }

  return { items, nextUrl: data.next ?? null, ok: true }
}

/** Fetch album/single/compilation groups for a Spotify artist id. */
export async function fetchSpotifyArtistAlbums(artistId: string): Promise<SpotifyArtistAlbumItem[]> {
  const items: SpotifyArtistAlbumItem[] = []
  let nextUrl: string | null = null

  do {
    const page = await fetchSpotifyArtistAlbumsPage(artistId, nextUrl)
    if (!page.ok) break
    items.push(...page.items)
    nextUrl = page.nextUrl
  } while (nextUrl)

  return items
}

/** Resolve artist name to Spotify artist id via search API. */
export async function searchSpotifyArtistId(artistName: string): Promise<string | null> {
  const token = await getSpotifyAccessToken()
  if (!token) return null

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=5`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    },
  )
  if (!res.ok) return null

  const data = (await res.json()) as {
    artists?: { items?: Array<{ id?: string; name?: string }> }
  }
  const items = data.artists?.items ?? []
  const exact = items.find((a) => a.name?.toLowerCase() === artistName.toLowerCase())
  return (exact ?? items[0])?.id ?? null
}