import type { Release } from '@/lib/app-types'

export interface ReleaseDbRow {
  id: string
  title: string
  type: string
  release_date: string | null
  description?: string | null
  cover_storage_path: string | null
  cover_url: string | null
  streaming_links: unknown
  artists?: string[] | null
  tracks?: unknown
  custom_links?: unknown
  manually_edited: boolean | null
  last_enriched_at?: string | null
  tracks_source?: string | null
}

export type OverlayReleaseTrack = NonNullable<Release['tracks']>[number]

export function normalizeReleaseType(value: string): Release['type'] {
  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'album' ||
    normalized === 'ep' ||
    normalized === 'single' ||
    normalized === 'remix' ||
    normalized === 'compilation'
  ) {
    return normalized
  }
  return ''
}

export function parseStreamingLinks(value: unknown): Array<{ platform: string; url: string }> {
  if (!Array.isArray(value)) return []
  return value.filter(
    (link): link is { platform: string; url: string } =>
      link !== null &&
      typeof link === 'object' &&
      typeof (link as Record<string, unknown>).platform === 'string' &&
      typeof (link as Record<string, unknown>).url === 'string',
  )
}

/** Parse track rows stored as jsonb on public.releases. */
export function parseReleaseTracks(value: unknown): OverlayReleaseTrack[] {
  if (!Array.isArray(value)) return []
  const tracks: OverlayReleaseTrack[] = []

  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const title = typeof row.title === 'string' ? row.title.trim() : ''
    if (!title) continue

    const track: OverlayReleaseTrack = { title }
    if (typeof row.duration === 'string' && row.duration.trim()) track.duration = row.duration.trim()
    if (typeof row.artist === 'string' && row.artist.trim()) track.artist = row.artist.trim()
    if (Array.isArray(row.featuredArtists)) {
      track.featuredArtists = row.featuredArtists.filter(
        (artist): artist is string => typeof artist === 'string' && artist.trim().length > 0,
      )
    }
    tracks.push(track)
  }

  return tracks
}

export function parseCustomLinks(value: unknown): Release['customLinks'] {
  if (!Array.isArray(value)) return undefined
  const links = value
    .filter(
      (item): item is { label: string; url: string } =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).label === 'string' &&
        typeof (item as Record<string, unknown>).url === 'string',
    )
    .map((item) => ({ label: item.label, url: item.url }))
  return links.length > 0 ? links : undefined
}

/** Map a Supabase releases row to the overlay Release shape (pre-migration parity). */
export function mapReleaseRowToOverlayRelease(row: ReleaseDbRow, coverUrl: string | null): Release {
  const releaseDate = row.release_date ?? undefined
  const releaseDateValue = releaseDate ? new Date(releaseDate) : null
  const year =
    releaseDateValue && !Number.isNaN(releaseDateValue.getTime())
      ? String(releaseDateValue.getFullYear())
      : '----'

  const tracks = parseReleaseTracks(row.tracks)
  const artists = Array.isArray(row.artists)
    ? row.artists.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    : undefined

  return {
    id: row.id,
    title: row.title,
    artwork: coverUrl ?? '',
    year,
    releaseDate,
    streamingLinks: parseStreamingLinks(row.streaming_links),
    type: normalizeReleaseType(row.type),
    description: typeof row.description === 'string' ? row.description : undefined,
    artists,
    tracks: tracks.length > 0 ? tracks : undefined,
    customLinks: parseCustomLinks(row.custom_links),
    manuallyEdited: !!row.manually_edited,
  }
}