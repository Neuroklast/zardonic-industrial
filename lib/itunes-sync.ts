import { normalizeReleaseDateForDb } from '@/lib/normalize-release-date'

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