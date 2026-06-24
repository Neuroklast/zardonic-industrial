export type ExternalReleaseSource = 'itunes' | 'spotify' | 'discogs'

const SPOTIFY_ID_RE = /^[0-9A-Za-z]{22}$/

function stripQueryAndHash(value: string): string {
  return value.split(/[?#]/, 1)[0]?.trim() ?? value
}

/** Extract a numeric iTunes collection/track id from raw input or Apple Music URL. */
export function normalizeItunesId(input: string): string | null {
  const trimmed = stripQueryAndHash(input.trim())
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed

  const patterns = [
    /\/id(\d+)/i,
    /[?&]i=(\d+)/i,
    /\/album\/[^/]+\/id(\d+)/i,
    /\/album\/id(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

/** Extract Spotify album/track id (22-char) from URI, URL variants, or bare id. */
export function normalizeSpotifyId(input: string): string | null {
  const trimmed = stripQueryAndHash(input.trim())
  if (!trimmed) return null

  const bare = trimmed.match(/^([0-9A-Za-z]{22})$/)?.[1]
  if (bare) return bare

  const uriMatch = trimmed.match(/spotify:(?:album|track|episode):([0-9A-Za-z]{22})/i)
  if (uriMatch) return uriMatch[1]

  const hostMatch = trimmed.match(
    /(?:open|play|embed)\.spotify\.com(?:\/intl-[a-z]{2})?\/(?:album|track|episode)\/([0-9A-Za-z]{22})/i,
  )
  if (hostMatch) return hostMatch[1]

  if (/spotify/i.test(trimmed)) {
    const pathMatch = trimmed.match(/\/([0-9A-Za-z]{22})(?:\/|$)/)
    if (pathMatch) return pathMatch[1]
  }

  return null
}

/** Extract Discogs release or master id from URL or raw number. */
export function normalizeDiscogsId(input: string): string | null {
  const trimmed = stripQueryAndHash(input.trim())
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
  const trimmed = stripQueryAndHash(input.trim())
  if (!trimmed) return null
  if (SPOTIFY_ID_RE.test(trimmed)) return trimmed

  const uriMatch = trimmed.match(/spotify:artist:([0-9A-Za-z]{22})/i)
  if (uriMatch) return uriMatch[1]

  const urlMatch = trimmed.match(
    /(?:open|play|embed)\.spotify\.com(?:\/intl-[a-z]{2})?\/artist\/([0-9A-Za-z]{22})/i,
  )
  if (urlMatch) return urlMatch[1]

  if (/spotify/i.test(trimmed)) {
    const pathMatch = trimmed.match(/\/artist\/([0-9A-Za-z]{22})/i)
    if (pathMatch) return pathMatch[1]
  }

  return null
}

/** Extract Discogs artist id from URL or raw number. */
export function normalizeDiscogsArtistId(input: string): string | null {
  const trimmed = stripQueryAndHash(input.trim())
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed
  const match = trimmed.match(/discogs\.com\/artist\/(\d+)/i)
  return match?.[1] ?? null
}

/** Extract Apple Music / iTunes artist id from URL or raw number. */
export function normalizeItunesArtistId(input: string): string | null {
  const trimmed = stripQueryAndHash(input.trim())
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return trimmed

  const artistPath = trimmed.match(/\/artist\/[^/]+\/(\d+)/i)?.[1]
  if (artistPath) return artistPath

  const idMatch = trimmed.match(/\/id(\d+)/i)
  return idMatch?.[1] ?? null
}