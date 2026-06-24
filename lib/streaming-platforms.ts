import type { StreamingLink } from '@/lib/release-metadata'

/** Preferred display order for known platforms; unknown platforms sort alphabetically after. */
export const STREAMING_PLATFORM_ORDER = [
  'spotify',
  'appleMusic',
  'youtube',
  'youtubeMusic',
  'soundcloud',
  'bandcamp',
  'deezer',
  'tidal',
  'amazonMusic',
  'beatport',
  'pandora',
  'napster',
  'audiomack',
  'anghami',
  'boomplay',
  'audius',
  'yandex',
  'spinrilla',
] as const

/** Map display names and aliases to canonical platform keys used in streaming_links. */
const PLATFORM_CANONICAL_KEYS: Record<string, string> = {
  spotify: 'spotify',
  applemusic: 'appleMusic',
  apple: 'appleMusic',
  itunes: 'appleMusic',
  youtube: 'youtube',
  youtubemusic: 'youtubeMusic',
  soundcloud: 'soundcloud',
  bandcamp: 'bandcamp',
  deezer: 'deezer',
  tidal: 'tidal',
  amazonmusic: 'amazonMusic',
  amazon: 'amazonMusic',
  beatport: 'beatport',
  pandora: 'pandora',
  napster: 'napster',
  audiomack: 'audiomack',
  anghami: 'anghami',
  boomplay: 'boomplay',
  audius: 'audius',
  yandex: 'yandex',
  spinrilla: 'spinrilla',
  discogs: 'discogs',
}

/** Normalise free-text platform labels (e.g. "Spotify", "Apple Music") to canonical keys. */
export function normalizeStreamingPlatform(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return trimmed
  if (STREAMING_PLATFORM_ORDER.includes(trimmed as (typeof STREAMING_PLATFORM_ORDER)[number])) {
    return trimmed
  }
  const aliasKey = trimmed.toLowerCase().replace(/[\s_-]+/g, '')
  return PLATFORM_CANONICAL_KEYS[aliasKey] ?? trimmed
}

const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  youtube: 'YouTube',
  youtubeMusic: 'YouTube Music',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  deezer: 'Deezer',
  tidal: 'Tidal',
  amazonMusic: 'Amazon Music',
  amazon: 'Amazon Music',
  beatport: 'Beatport',
  pandora: 'Pandora',
  napster: 'Napster',
  audiomack: 'Audiomack',
  anghami: 'Anghami',
  boomplay: 'Boomplay',
  audius: 'Audius',
  yandex: 'Yandex Music',
  spinrilla: 'Spinrilla',
  discogs: 'Discogs',
}

export function formatStreamingPlatformLabel(platform: string): string {
  if (PLATFORM_LABELS[platform]) return PLATFORM_LABELS[platform]
  return platform
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function sortStreamingLinks(links: StreamingLink[]): StreamingLink[] {
  const orderIndex = new Map<string, number>(
    STREAMING_PLATFORM_ORDER.map((platform, index) => [platform, index]),
  )

  return [...links].sort((left, right) => {
    const leftIndex = orderIndex.get(left.platform) ?? 999
    const rightIndex = orderIndex.get(right.platform) ?? 999
    if (leftIndex !== rightIndex) return leftIndex - rightIndex
    return formatStreamingPlatformLabel(left.platform).localeCompare(
      formatStreamingPlatformLabel(right.platform),
    )
  })
}

export function getVisibleStreamingLinks(links: StreamingLink[] | undefined): StreamingLink[] {
  if (!Array.isArray(links)) return []
  return sortStreamingLinks(
    links.filter((link) => typeof link.platform === 'string' && typeof link.url === 'string' && link.url.trim()),
  )
}