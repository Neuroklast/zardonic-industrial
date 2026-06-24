import { getApiSecret } from '@/lib/api-secrets'
import { normalizeReleaseDateForDb } from '@/lib/normalize-release-date'
import {
  inferReleaseTypeFromTitle,
  type ReleaseMetadata,
  type ReleaseTrackMetadata,
} from '@/lib/release-metadata'

const DISCOGS_BASE = 'https://api.discogs.com'
const DISCOGS_USER_AGENT = `ZardonicWebsite/1.0 +${process.env.SITE_URL || 'https://zardonic.com'}`

interface DiscogsArtistCredit {
  name?: string
}

interface DiscogsImage {
  uri?: string
  type?: string
}

interface DiscogsReleasePayload {
  id?: number
  title?: string
  year?: number | string
  artists?: DiscogsArtistCredit[]
  images?: DiscogsImage[]
  formats?: Array<{ name?: string; descriptions?: string[] }>
  genres?: string[]
  styles?: string[]
  uri?: string
  notes?: string
  tracklist?: Array<{ title?: string; duration?: string }>
}

interface DiscogsMasterPayload {
  id?: number
  title?: string
  year?: number | string
  artists?: DiscogsArtistCredit[]
  images?: DiscogsImage[]
  genres?: string[]
  styles?: string[]
  uri?: string
  notes?: string
}

function discogsHeaders(token: string): Record<string, string> {
  return {
    'User-Agent': DISCOGS_USER_AGENT,
    Authorization: `Discogs token=${token}`,
    Accept: 'application/json',
  }
}

function parseDiscogsTracklist(
  tracklist: DiscogsReleasePayload['tracklist'],
): ReleaseTrackMetadata[] {
  if (!tracklist?.length) return []
  const tracks: ReleaseTrackMetadata[] = []
  for (const row of tracklist) {
    const title = row.title?.trim()
    if (!title || title === 'Video' || title === 'DVD') continue
    const track: ReleaseTrackMetadata = { title }
    if (typeof row.duration === 'string' && row.duration.trim()) {
      track.duration = row.duration.trim()
    }
    tracks.push(track)
  }
  return tracks
}

function pickDiscogsCover(images: DiscogsImage[] | undefined): string | null {
  if (!images?.length) return null
  const primary = images.find((img) => img.type === 'primary' && img.uri)
  return primary?.uri ?? images[0]?.uri ?? null
}

function parseDiscogsRelease(data: DiscogsReleasePayload, discogsId: string): ReleaseMetadata | null {
  const title = data.title?.trim()
  if (!title) return null

  const artists = (data.artists ?? []).map((a) => a.name?.trim()).filter((n): n is string => Boolean(n))
  const formatHints = (data.formats ?? []).flatMap((f) => [f.name, ...(f.descriptions ?? [])].filter(Boolean) as string[])
  const discogsUrl = data.uri ?? `https://www.discogs.com/release/${discogsId}`

  const tracks = parseDiscogsTracklist(data.tracklist)

  return {
    title,
    type: inferReleaseTypeFromTitle(title, [...formatHints, ...(data.genres ?? []), ...(data.styles ?? [])]),
    release_date: normalizeReleaseDateForDb(data.year ? String(data.year) : null),
    description: data.notes?.trim() || null,
    artists,
    coverUrl: pickDiscogsCover(data.images),
    streaming_links: [{ platform: 'discogs', url: discogsUrl }],
    tracks: tracks.length > 0 ? tracks : undefined,
    discogs_id: discogsId,
  }
}

function parseDiscogsMaster(data: DiscogsMasterPayload, discogsId: string): ReleaseMetadata | null {
  const title = data.title?.trim()
  if (!title) return null

  const artists = (data.artists ?? []).map((a) => a.name?.trim()).filter((n): n is string => Boolean(n))
  const discogsUrl = data.uri ?? `https://www.discogs.com/master/${discogsId}`

  return {
    title,
    type: inferReleaseTypeFromTitle(title, [...(data.genres ?? []), ...(data.styles ?? [])]),
    release_date: normalizeReleaseDateForDb(data.year ? String(data.year) : null),
    description: data.notes?.trim() || null,
    artists,
    coverUrl: pickDiscogsCover(data.images),
    streaming_links: [{ platform: 'discogs', url: discogsUrl }],
    discogs_id: discogsId,
  }
}

export async function fetchReleaseMetadataFromDiscogs(discogsId: string): Promise<ReleaseMetadata | null> {
  const token = await getApiSecret('discogs_token')
  if (!token) return null

  const releaseRes = await fetch(`${DISCOGS_BASE}/releases/${encodeURIComponent(discogsId)}`, {
    headers: discogsHeaders(token),
    cache: 'no-store',
  })
  if (releaseRes.ok) {
    const data = (await releaseRes.json()) as DiscogsReleasePayload
    return parseDiscogsRelease(data, discogsId)
  }

  if (releaseRes.status !== 404) return null

  const masterRes = await fetch(`${DISCOGS_BASE}/masters/${encodeURIComponent(discogsId)}`, {
    headers: discogsHeaders(token),
    cache: 'no-store',
  })
  if (!masterRes.ok) return null

  const masterData = (await masterRes.json()) as DiscogsMasterPayload
  return parseDiscogsMaster(masterData, discogsId)
}

export interface DiscogsArtistReleaseItem {
  discogs_id: string
  metadata: ReleaseMetadata
}

export async function searchDiscogsArtistId(artistName: string): Promise<number | null> {
  const token = await getApiSecret('discogs_token')
  if (!token) return null

  const url = `${DISCOGS_BASE}/database/search?q=${encodeURIComponent(artistName)}&type=artist&per_page=10`
  const res = await fetch(url, { headers: discogsHeaders(token), cache: 'no-store' })
  if (!res.ok) return null

  const data = (await res.json()) as {
    results?: Array<{ id?: number; title?: string; type?: string }>
  }
  const results = data.results ?? []
  const exact = results.find(
    (r) => r.type === 'artist' && r.title?.toLowerCase() === artistName.toLowerCase(),
  )
  const first = results.find((r) => r.type === 'artist') ?? results[0]
  return (exact ?? first)?.id ?? null
}

export interface DiscogsArtistReleasesPageResult {
  items: DiscogsArtistReleaseItem[]
  page: number
  totalPages: number
  ok: boolean
}

function parseDiscogsArtistReleaseRow(item: {
  id?: number
  title?: string
  year?: number
  type?: string
  main_release?: number
  thumb?: string
  resource_url?: string
}): DiscogsArtistReleaseItem | null {
  const releaseId = item.type === 'master' ? item.main_release ?? item.id : item.id
  if (!releaseId || !item.title) return null

  const discogsId = String(releaseId)
  const discogsUrl =
    item.resource_url?.replace('api.discogs.com/releases', 'www.discogs.com/release') ??
    `https://www.discogs.com/release/${discogsId}`

  return {
    discogs_id: discogsId,
    metadata: {
      title: item.title.trim(),
      type: inferReleaseTypeFromTitle(item.title),
      release_date: normalizeReleaseDateForDb(item.year ? String(item.year) : null),
      description: null,
      artists: [],
      coverUrl: item.thumb ? item.thumb.replace('/images/thumb/', '/images/').replace('.jpeg', '.jpg') : null,
      streaming_links: [{ platform: 'discogs', url: discogsUrl }],
      discogs_id: discogsId,
    },
  }
}

/** Fetch a single page of an artist's Discogs releases (for chunked sync jobs). */
export async function fetchDiscogsArtistReleasesPage(
  artistId: number,
  page: number,
): Promise<DiscogsArtistReleasesPageResult> {
  const token = await getApiSecret('discogs_token')
  if (!token) return { items: [], page, totalPages: 0, ok: false }

  const url = `${DISCOGS_BASE}/artists/${artistId}/releases?per_page=100&page=${page}&sort=year&sort_order=desc`
  const res = await fetch(url, { headers: discogsHeaders(token), cache: 'no-store' })
  if (!res.ok) return { items: [], page, totalPages: 0, ok: false }

  const data = (await res.json()) as {
    releases?: Array<{
      id?: number
      title?: string
      year?: number
      type?: string
      main_release?: number
      thumb?: string
      resource_url?: string
    }>
    pagination?: { pages?: number }
  }

  const items: DiscogsArtistReleaseItem[] = []
  for (const row of data.releases ?? []) {
    const parsed = parseDiscogsArtistReleaseRow(row)
    if (parsed) items.push(parsed)
  }

  return {
    items,
    page,
    totalPages: data.pagination?.pages ?? 1,
    ok: true,
  }
}

export async function fetchDiscogsArtistReleases(artistId: number): Promise<DiscogsArtistReleaseItem[]> {
  const items: DiscogsArtistReleaseItem[] = []
  let page = 1
  let totalPages = 1

  do {
    const result = await fetchDiscogsArtistReleasesPage(artistId, page)
    if (!result.ok) break
    items.push(...result.items)
    totalPages = result.totalPages
    page++
    if (page <= totalPages) {
      await new Promise<void>((resolve) => setTimeout(resolve, 600))
    }
  } while (page <= totalPages)

  return items
}