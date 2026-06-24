import {
  extractDiscogsIdFromLinks,
  extractItunesAlbumIdFromLinks,
  extractSpotifyAlbumIdFromLinks,
} from '@/lib/release-streaming-enrichment'
import { parseStreamingLinks } from '@/lib/release-public-mapper'

export interface ReleaseTitleMatchOptions {
  artistNames?: string[]
}

export interface ReleaseMatchableRow {
  title: string
  type: string
  release_date: string | null
  streaming_links: unknown
  spotify_id: string | null
  itunes_id: string | null
  discogs_id: string | null
}

const DEFAULT_ARTIST_PREFIXES = ['zardonic']

const TRAILING_SUFFIX_RE =
  /\s*[-–—:]\s*(ep|single|singles|remix(?:es)?|deluxe(?:\s+edition)?|special\s+edition|expanded\s+edition|anniversary\s+edition|remaster(?:ed)?(?:\s+\d{4})?)\s*$/i

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripArtistPrefixes(title: string, artistNames: string[]): string {
  let result = title
  for (const artist of artistNames) {
    const escaped = escapeRegExp(artist.trim())
    if (!escaped) continue
    result = result.replace(new RegExp(`^${escaped}\\s*[-–—:]\\s*`, 'i'), '')
    result = result.replace(new RegExp(`\\s*[-–—:]\\s*${escaped}$`, 'i'), '')
    result = result.replace(new RegExp(`^${escaped}\\s+`, 'i'), '')
    result = result.replace(new RegExp(`\\s+${escaped}$`, 'i'), '')
  }
  return result
}

/** Aggressive normalization for cross-platform duplicate detection. */
export function normalizeReleaseTitleKey(
  title: string,
  options?: ReleaseTitleMatchOptions,
): string {
  const artistNames = [
    ...DEFAULT_ARTIST_PREFIXES,
    ...(options?.artistNames ?? []).map((name) => name.toLowerCase().trim()).filter(Boolean),
  ]

  let normalized = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+feat\.?\s+[^()[\]-]+/gi, '')
    .replace(/\s+ft\.?\s+[^()[\]-]+/gi, '')
    .replace(/\s+featuring\s+[^()[\]-]+/gi, '')

  normalized = stripArtistPrefixes(normalized, artistNames)
  normalized = normalized.replace(TRAILING_SUFFIX_RE, '')
  normalized = normalized.replace(/\s*\([^)]*\)/g, '')
  normalized = normalized.replace(/\s*\[[^\]]*\]/g, '')
  normalized = normalized.replace(/\s*\{[^}]*\}/g, '')
  normalized = normalized.replace(/^the\s+/, '')
  normalized = normalized.replace(/[''`]/g, "'")
  normalized = normalized.replace(/[^\w\s']/g, ' ')
  normalized = normalized.replace(/\s+/g, ' ')
  normalized = normalized.trim()

  return normalized
}

function titleTokens(key: string): Set<string> {
  const tokens = new Set<string>()
  for (const token of key.split(' ')) {
    if (token.length > 1) tokens.add(token)
  }
  return tokens
}

function tokenOverlapRatio(a: string, b: string): number {
  const tokensA = titleTokens(a)
  const tokensB = titleTokens(b)
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  const smaller = tokensA.size <= tokensB.size ? tokensA : tokensB
  const larger = tokensA.size > tokensB.size ? tokensA : tokensB
  let overlap = 0
  for (const token of smaller) {
    if (larger.has(token)) overlap++
  }
  return overlap / smaller.size
}

/** Fuzzy title comparison after normalization. */
export function releaseTitleKeysMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true

  if (tokenOverlapRatio(a, b) >= 0.8) return true

  const shorter = a.length <= b.length ? a : b
  const longer = a.length > b.length ? a : b
  if (shorter.length >= 3 && longer.startsWith(shorter)) return true
  if (shorter.length >= 4 && longer.includes(shorter) && shorter.length >= longer.length * 0.45) {
    return true
  }

  return false
}

export function releaseStreamingFingerprints(row: ReleaseMatchableRow): Set<string> {
  const fingerprints = new Set<string>()
  if (row.spotify_id) fingerprints.add(`spotify:${row.spotify_id}`)
  if (row.itunes_id) fingerprints.add(`itunes:${row.itunes_id}`)
  if (row.discogs_id) fingerprints.add(`discogs:${row.discogs_id}`)

  const links = parseStreamingLinks(row.streaming_links)
  const spotifyId = extractSpotifyAlbumIdFromLinks(links)
  const itunesId = extractItunesAlbumIdFromLinks(links)
  const discogsId = extractDiscogsIdFromLinks(links)
  if (spotifyId) fingerprints.add(`spotify:${spotifyId}`)
  if (itunesId) fingerprints.add(`itunes:${itunesId}`)
  if (discogsId) fingerprints.add(`discogs:${discogsId}`)

  return fingerprints
}

export function sharedStreamingFingerprint(
  a: ReleaseMatchableRow,
  b: ReleaseMatchableRow,
): string | null {
  const fa = releaseStreamingFingerprints(a)
  const fb = releaseStreamingFingerprints(b)
  for (const fingerprint of fa) {
    if (fb.has(fingerprint)) return fingerprint
  }
  return null
}

export function hasComplementaryExternalIds(
  a: ReleaseMatchableRow,
  b: ReleaseMatchableRow,
): boolean {
  const aIds = {
    spotify: Boolean(a.spotify_id),
    itunes: Boolean(a.itunes_id),
    discogs: Boolean(a.discogs_id),
  }
  const bIds = {
    spotify: Boolean(b.spotify_id),
    itunes: Boolean(b.itunes_id),
    discogs: Boolean(b.discogs_id),
  }

  const aCount = Number(aIds.spotify) + Number(aIds.itunes) + Number(aIds.discogs)
  const bCount = Number(bIds.spotify) + Number(bIds.itunes) + Number(bIds.discogs)
  if (aCount === 0 || bCount === 0) return false

  const sharedSpotify = a.spotify_id && a.spotify_id === b.spotify_id
  const sharedItunes = a.itunes_id && a.itunes_id === b.itunes_id
  const sharedDiscogs = a.discogs_id && a.discogs_id === b.discogs_id
  if (sharedSpotify || sharedItunes || sharedDiscogs) return false

  return (
    (aIds.spotify && !bIds.spotify && (bIds.itunes || bIds.discogs)) ||
    (bIds.spotify && !aIds.spotify && (aIds.itunes || aIds.discogs)) ||
    (aIds.itunes && !bIds.itunes && (bIds.spotify || bIds.discogs)) ||
    (bIds.itunes && !aIds.itunes && (aIds.spotify || aIds.discogs)) ||
    (aIds.discogs && !bIds.discogs && (bIds.spotify || bIds.itunes)) ||
    (bIds.discogs && !aIds.discogs && (aIds.spotify || aIds.itunes))
  )
}

export function releaseDatesAlign(a: string | null, b: string | null): boolean {
  if (!a || !b) return true
  if (a === b) return true
  if (a.slice(0, 7) === b.slice(0, 7)) return true
  if (a.slice(0, 4) === b.slice(0, 4)) return true
  return false
}