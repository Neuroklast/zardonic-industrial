import { normalizeReleaseDateForDb } from '@/lib/normalize-release-date'
import { normalizeReleaseType } from '@/lib/release-public-mapper'

export interface ItunesSearchResult {
  collectionId?: number
  trackId?: number
  collectionName?: string
  trackName?: string
  wrapperType?: string
  kind?: string
  collectionType?: string
  artworkUrl100?: string
  releaseDate?: string
}

export function parseItunesItem(item: ItunesSearchResult): {
  title: string
  type: string
  release_date: string | null
  itunes_id: string
  artworkUrl: string | null
} | null {
  const isAlbum =
    item.wrapperType === 'collection' &&
    (item.collectionType === 'Album' || item.collectionType === 'Single')
  const isMusicVideo = item.wrapperType === 'track' && item.kind === 'music-video'
  const isSong = item.wrapperType === 'track' && item.kind === 'song'

  if (!isAlbum && !isMusicVideo && !isSong) return null

  const title = item.collectionName ?? item.trackName
  if (!title) return null

  const rawId = item.collectionId ?? item.trackId
  if (!rawId) return null

  const nameLower = title.toLowerCase()
  let type = 'album'
  if (nameLower.includes(' ep') || nameLower.endsWith(' ep')) type = 'ep'
  else if (nameLower.includes('single') || item.collectionType === 'Single') type = 'single'
  else if (nameLower.includes('remix') || nameLower.includes('remixed')) type = 'remix'
  else if (nameLower.includes('compilation') || nameLower.includes('best of')) type = 'compilation'

  const artworkUrl = item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '1000x1000bb')
    : null

  const release_date = normalizeReleaseDateForDb(item.releaseDate)

  return { title, type, release_date, itunes_id: String(rawId), artworkUrl }
}

const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup'

/** Fetch a single iTunes item by collection/track id. */
export async function fetchItunesItemById(itunesId: string): Promise<ItunesSearchResult | null> {
  const res = await fetch(`${ITUNES_LOOKUP_URL}?id=${encodeURIComponent(itunesId)}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data = (await res.json()) as { results?: ItunesSearchResult[] }
  return data.results?.[0] ?? null
}

/** Fetch albums, songs, and music videos for an iTunes/Apple Music artist id. */
export async function fetchItunesArtistCatalogue(artistId: string): Promise<ItunesSearchResult[]> {
  const entities = ['album', 'song', 'musicVideo'] as const
  const results = await Promise.allSettled(
    entities.map(async (entity) => {
      const res = await fetch(
        `${ITUNES_LOOKUP_URL}?id=${encodeURIComponent(artistId)}&entity=${entity}&limit=200`,
        { cache: 'no-store' },
      )
      if (!res.ok) return [] as ItunesSearchResult[]
      const data = (await res.json()) as { results?: ItunesSearchResult[] }
      return data.results ?? []
    }),
  )

  const items: ItunesSearchResult[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') items.push(...result.value)
  }
  return items
}

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'

/** Build deduplicated catalogue import items for async iTunes sync jobs. */
export async function buildItunesCatalogueImportItems(options: {
  artistName: string
  itunesArtistId: string | null
}): Promise<{ items: import('@/lib/catalogue-import').CatalogueImportItem[]; errors: string[] }> {
  const errors: string[] = []
  const artistName = options.artistName.trim()

  let rawItems: ItunesSearchResult[] = []
  if (options.itunesArtistId) {
    rawItems = await fetchItunesArtistCatalogue(options.itunesArtistId)
    if (rawItems.length === 0) errors.push('No releases found for configured iTunes artist ID')
  } else if (artistName) {
    const [albumsRes, songsRes, singlesRes] = await Promise.allSettled([
      fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artistName)}&entity=album&limit=200`, {
        cache: 'no-store',
      }),
      fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artistName)}&entity=song&limit=200`, {
        cache: 'no-store',
      }),
      fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artistName)}&entity=musicVideo&limit=200`, {
        cache: 'no-store',
      }),
    ])

    if (albumsRes.status === 'fulfilled' && albumsRes.value.ok) {
      const data = (await albumsRes.value.json()) as { results?: ItunesSearchResult[] }
      rawItems.push(...(data.results ?? []))
    } else {
      errors.push('Failed to fetch albums from iTunes')
    }

    if (songsRes.status === 'fulfilled' && songsRes.value.ok) {
      const data = (await songsRes.value.json()) as { results?: ItunesSearchResult[] }
      rawItems.push(...(data.results ?? []))
    }

    if (singlesRes.status === 'fulfilled' && singlesRes.value.ok) {
      const data = (await singlesRes.value.json()) as { results?: ItunesSearchResult[] }
      rawItems.push(...(data.results ?? []))
    }
  }

  const seen = new Set<string>()
  const items: import('@/lib/catalogue-import').CatalogueImportItem[] = []

  for (const raw of rawItems) {
    const parsed = parseItunesItem(raw)
    if (!parsed || seen.has(parsed.itunes_id)) continue
    seen.add(parsed.itunes_id)

    items.push({
      externalId: parsed.itunes_id,
      metadata: {
        title: parsed.title,
        type: normalizeReleaseType(parsed.type) || 'album',
        release_date: parsed.release_date,
        description: null,
        itunes_id: parsed.itunes_id,
        coverUrl: parsed.artworkUrl,
        artists: artistName ? [artistName] : [],
        streaming_links: [
          { platform: 'appleMusic', url: `https://music.apple.com/album/id${parsed.itunes_id}` },
        ],
      },
    })
  }

  return { items, errors }
}