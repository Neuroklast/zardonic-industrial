export type ExternalReleaseSource = 'itunes' | 'spotify' | 'discogs'

const SPOTIFY_ID_RE = /^[0-9A-Za-z]{22}$/

/** Extract a numeric iTunes collection/track id from raw input or Apple Music URL. */
export function normalizeItunesId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed
  const fromUrl = trimmed.match(/\/id(\d+)/i)?.[1] ?? trimmed.match(/[?&]i=(\d+)/i)?.[1]
  return fromUrl ?? null
}

/** Extract Spotify album/track id (22-char) from URI or open.spotify.com URL. */
export function normalizeSpotifyId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (SPOTIFY_ID_RE.test(trimmed)) return trimmed
  const uriMatch = trimmed.match(/spotify:(?:album|track):([0-9A-Za-z]{22})/i)
  if (uriMatch) return uriMatch[1]
  const urlMatch = trimmed.match(/open\.spotify\.com\/(?:album|track)\/([0-9A-Za-z]{22})/i)
  return urlMatch?.[1] ?? null
}

/** Extract Discogs release or master id from URL or raw number. */
export function normalizeDiscogsId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed
  const match = trimmed.match(/discogs\.com\/(?:release|master)\/(\d+)/i)
  return match?.[1] ?? null
}

export function normalizeExternalId(source: ExternalReleaseSource, input: string): string | null {
  switch (source) {
    case 'itunes':
      return normalizeItunesId(input)
    case 'spotify':
      return normalizeSpotifyId(input)
    case 'discogs':
      return normalizeDiscogsId(input)
    default:
      return null
  }
}

/** Extract Spotify artist id (22-char) from URI or open.spotify.com/artist URL. */
export function normalizeSpotifyArtistId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (SPOTIFY_ID_RE.test(trimmed)) return trimmed
  const uriMatch = trimmed.match(/spotify:artist:([0-9A-Za-z]{22})/i)
  if (uriMatch) return uriMatch[1]
  const urlMatch = trimmed.match(/open\.spotify\.com\/artist\/([0-9A-Za-z]{22})/i)
  return urlMatch?.[1] ?? null
}

/** Extract Discogs artist id from URL or raw number. */
export function normalizeDiscogsArtistId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed
  const match = trimmed.match(/discogs\.com\/artist\/(\d+)/i)
  return match?.[1] ?? null
}

/** Extract Apple Music / iTunes artist id from URL or raw number. */
export function normalizeItunesArtistId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed
  const artistPath = trimmed.match(/\/artist\/[^/]+\/(\d+)/i)?.[1]
  if (artistPath) return artistPath
  const idMatch = trimmed.match(/\/id(\d+)/i)
  return idMatch?.[1] ?? null
}