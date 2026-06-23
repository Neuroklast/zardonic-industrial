import { getSpotifyAccessToken } from '@/lib/spotify-client'
import { inferReleaseTypeFromTitle, type ReleaseMetadata } from '@/lib/release-metadata'

interface SpotifyImage {
  url?: string
  height?: number
}

interface SpotifyArtistRef {
  name?: string
}

interface SpotifyAlbumPayload {
  id?: string
  name?: string
  album_type?: string
  release_date?: string
  images?: SpotifyImage[]
  artists?: SpotifyArtistRef[]
  external_urls?: { spotify?: string }
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

function parseSpotifyAlbum(data: SpotifyAlbumPayload): ReleaseMetadata | null {
  const title = data.name?.trim()
  const spotifyId = data.id
  if (!title || !spotifyId) return null

  const artists = (data.artists ?? []).map((a) => a.name?.trim()).filter((n): n is string => Boolean(n))
  const spotifyUrl = data.external_urls?.spotify ?? `https://open.spotify.com/album/${spotifyId}`

  return {
    title,
    type: mapSpotifyAlbumType(data.album_type, title),
    release_date: data.release_date ? data.release_date.slice(0, 10) : null,
    description: null,
    artists,
    coverUrl: pickLargestImage(data.images),
    streaming_links: [{ platform: 'spotify', url: spotifyUrl }],
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
    release_date: album?.release_date ? album.release_date.slice(0, 10) : null,
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
    return parseSpotifyAlbum(data)
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

/** Fetch album/single/compilation groups for a Spotify artist id. */
export async function fetchSpotifyArtistAlbums(artistId: string): Promise<SpotifyArtistAlbumItem[]> {
  const token = await getSpotifyAccessToken()
  if (!token) return []

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  const items: SpotifyArtistAlbumItem[] = []
  let url: string | null =
    `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}/albums?include_groups=album,single,compilation&limit=50`

  while (url) {
    const res = await fetch(url, { headers, cache: 'no-store' })
    if (!res.ok) break
    const data = (await res.json()) as {
      items?: SpotifyAlbumPayload[]
      next?: string | null
    }
    for (const album of data.items ?? []) {
      const metadata = parseSpotifyAlbum(album)
      if (metadata?.spotify_id) items.push({ spotify_id: metadata.spotify_id, metadata })
    }
    url = data.next ?? null
  }

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