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
  type?: string
  release_date: string | null
  streaming_links: unknown
  cover_url?: string | null
  cover_storage_path?: string | null
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
    .replace(/\([^)]*\bfeat\.?[^)]*\)/gi, '')
    .replace(/\([^)]*\bfeaturing\b[^)]*\)/gi, '')
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

export function releaseTitleTokenOverlap(a: string, b: string): number {
  return tokenOverlapRatio(a, b)
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

function hasPlatformFingerprint(fingerprints: Set<string>, platform: 'spotify' | 'itunes' | 'discogs'): boolean {
  for (const fingerprint of fingerprints) {
    if (fingerprint.startsWith(`${platform}:`)) return true
  }
  return false
}

/** True when two rows anchor different platforms (column or streaming link) with no shared id. */
export function hasComplementaryExternalIds(
  a: ReleaseMatchableRow,
  b: ReleaseMatchableRow,
): boolean {
  const fa = releaseStreamingFingerprints(a)
  const fb = releaseStreamingFingerprints(b)
  for (const fingerprint of fa) {
    if (fb.has(fingerprint)) return false
  }

  const aSpotify = hasPlatformFingerprint(fa, 'spotify')
  const aItunes = hasPlatformFingerprint(fa, 'itunes')
  const aDiscogs = hasPlatformFingerprint(fa, 'discogs')
  const bSpotify = hasPlatformFingerprint(fb, 'spotify')
  const bItunes = hasPlatformFingerprint(fb, 'itunes')
  const bDiscogs = hasPlatformFingerprint(fb, 'discogs')

  const aCount = Number(aSpotify) + Number(aItunes) + Number(aDiscogs)
  const bCount = Number(bSpotify) + Number(bItunes) + Number(bDiscogs)
  if (aCount === 0 || bCount === 0) return false

  return (
    (aSpotify && !bSpotify && (bItunes || bDiscogs)) ||
    (bSpotify && !aSpotify && (aItunes || aDiscogs)) ||
    (aItunes && !bItunes && (bSpotify || bDiscogs)) ||
    (bItunes && !aItunes && (aSpotify || bDiscogs)) ||
    (aDiscogs && !bDiscogs && (bSpotify || bItunes)) ||
    (bDiscogs && !aDiscogs && (aSpotify || aItunes))
  )
}

export function releaseDatesAlign(a: string | null, b: string | null): boolean {
  if (!a || !b) return true
  if (a === b) return true
  if (a.slice(0, 7) === b.slice(0, 7)) return true
  if (a.slice(0, 4) === b.slice(0, 4)) return true
  return false
}

function stripUrlQuery(url: string): string {
  try {
    const parsed = new URL(url.trim())
    return `${parsed.origin}${parsed.pathname}`.toLowerCase()
  } catch {
    return url.trim().toLowerCase().split('?')[0]?.split('#')[0] ?? ''
  }
}

/** Platform-agnostic fingerprint for cover art URLs (size variants collapse to one id). */
export function normalizeCoverArtFingerprint(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const cleaned = stripUrlQuery(url)

  const scdn = cleaned.match(/\/image\/([a-f0-9]{16,})/i)
  if (scdn) return `scdn:${scdn[1]}`

  const mzSized = cleaned.match(/mzstatic\.com\/image\/thumb\/(.+?)\/\d+x\d+bb\.[a-z0-9]+$/i)
  if (mzSized) return `mzstatic:${mzSized[1].replace(/\//g, '-')}`

  const mz = cleaned.match(/mzstatic\.com\/image\/thumb\/(.+)/i)
  if (mz) return `mzstatic:${mz[1].replace(/\//g, '-')}`

  const discogs = cleaned.match(/img\.discogs\.com\/[^/]+\/([a-z0-9]+-[a-z0-9]+)/i)
  if (discogs) return `discogs-img:${discogs[1]}`

  return `url:${cleaned}`
}

export function releaseCoverFingerprints(row: ReleaseMatchableRow): Set<string> {
  const fingerprints = new Set<string>()

  const storagePath = row.cover_storage_path?.trim().toLowerCase()
  if (storagePath) fingerprints.add(`storage:${storagePath}`)

  const coverFingerprint = normalizeCoverArtFingerprint(row.cover_url)
  if (coverFingerprint) fingerprints.add(coverFingerprint)

  return fingerprints
}

export function sharedCoverFingerprint(
  a: ReleaseMatchableRow,
  b: ReleaseMatchableRow,
): string | null {
  const fa = releaseCoverFingerprints(a)
  const fb = releaseCoverFingerprints(b)
  for (const fingerprint of fa) {
    if (fb.has(fingerprint)) return fingerprint
  }
  return null
}

const LOOSE_CATALOGUE_TYPES = new Set(['album', 'ep', 'compilation', 'single', 'remix'])

function catalogueTypesLooselyCompatible(a: string, b: string): boolean {
  if (a === b) return true
  return LOOSE_CATALOGUE_TYPES.has(a) && LOOSE_CATALOGUE_TYPES.has(b)
}

function isStrongCoverFingerprint(fingerprint: string): boolean {
  return (
    fingerprint.startsWith('scdn:') ||
    fingerprint.startsWith('mzstatic:') ||
    fingerprint.startsWith('discogs-img:') ||
    fingerprint.startsWith('storage:')
  )
}

/** Same artwork is a strong duplicate signal when dates or catalogue ids align. */
export function releasesMatchByCoverArt(
  a: ReleaseMatchableRow,
  b: ReleaseMatchableRow,
  options?: ReleaseTitleMatchOptions,
): boolean {
  const sharedCover = sharedCoverFingerprint(a, b)
  if (!sharedCover) return false
  if (!catalogueTypesLooselyCompatible(a.type ?? 'album', b.type ?? 'album')) return false

  if (releaseDatesAlign(a.release_date, b.release_date)) return true
  if (hasComplementaryExternalIds(a, b)) return true

  const keyA = normalizeReleaseTitleKey(a.title, options)
  const keyB = normalizeReleaseTitleKey(b.title, options)
  if (releaseTitleTokenOverlap(keyA, keyB) >= 0.35) return true

  return isStrongCoverFingerprint(sharedCover)
}