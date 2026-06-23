import { inferReleaseTypeFromTitle, type ReleaseMetadata } from '@/lib/release-metadata'

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
  tracklist?: Array<{ title?: string }>
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

  return {
    title,
    type: inferReleaseTypeFromTitle(title, [...formatHints, ...(data.genres ?? []), ...(data.styles ?? [])]),
    release_date: data.year ? String(data.year).slice(0, 10) : null,
    description: data.notes?.trim() || null,
    artists,
    coverUrl: pickDiscogsCover(data.images),
    streaming_links: [{ platform: 'discogs', url: discogsUrl }],
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
    release_date: data.year ? String(data.year).slice(0, 10) : null,
    description: data.notes?.trim() || null,
    artists,
    coverUrl: pickDiscogsCover(data.images),
    streaming_links: [{ platform: 'discogs', url: discogsUrl }],
    discogs_id: discogsId,
  }
}

export async function fetchReleaseMetadataFromDiscogs(discogsId: string): Promise<ReleaseMetadata | null> {
  const token = process.env.DISCOGS_TOKEN
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
  const token = process.env.DISCOGS_TOKEN
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

export async function fetchDiscogsArtistReleases(artistId: number): Promise<DiscogsArtistReleaseItem[]> {
  const token = process.env.DISCOGS_TOKEN
  if (!token) return []

  const items: DiscogsArtistReleaseItem[] = []
  let page = 1
  let totalPages = 1

  do {
    const url = `${DISCOGS_BASE}/artists/${artistId}/releases?per_page=100&page=${page}&sort=year&sort_order=desc`
    const res = await fetch(url, { headers: discogsHeaders(token), cache: 'no-store' })
    if (!res.ok) break

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

    for (const item of data.releases ?? []) {
      const releaseId = item.type === 'master' ? item.main_release ?? item.id : item.id
      if (!releaseId || !item.title) continue

      const discogsId = String(releaseId)
      const discogsUrl =
        item.resource_url?.replace('api.discogs.com/releases', 'www.discogs.com/release') ??
        `https://www.discogs.com/release/${discogsId}`

      items.push({
        discogs_id: discogsId,
        metadata: {
          title: item.title.trim(),
          type: inferReleaseTypeFromTitle(item.title),
          release_date: item.year ? String(item.year) : null,
          description: null,
          artists: [],
          coverUrl: item.thumb ? item.thumb.replace('/images/thumb/', '/images/').replace('.jpeg', '.jpg') : null,
          streaming_links: [{ platform: 'discogs', url: discogsUrl }],
          discogs_id: discogsId,
        },
      })
    }

    totalPages = data.pagination?.pages ?? 1
    page++
    if (page <= totalPages) {
      await new Promise<void>((resolve) => setTimeout(resolve, 600))
    }
  } while (page <= totalPages)

  return items
}