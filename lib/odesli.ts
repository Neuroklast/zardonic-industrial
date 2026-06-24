import { fetchWithRetry } from '@/lib/fetch-retry'
import type { StreamingLink } from '@/lib/release-metadata'

const PLATFORM_NAME_MAP: Record<string, string> = {
  amazon: 'amazonMusic',
}

export interface OdesliLink {
  url: string
  entityUniqueId?: string
}

export interface OdesliEntity {
  id: string
  type: string
  title?: string
  artistName?: string
  thumbnailUrl?: string
  apiProvider?: string
}

export interface OdesliResponse {
  entityUniqueId?: string
  entitiesByUniqueId?: Record<string, OdesliEntity>
  linksByPlatform?: Record<string, OdesliLink | undefined>
}

export interface OdesliFetchResult {
  links: StreamingLink[]
  entityType?: string
  artwork?: string
}

/** Flat client-side result used by legacy release editor dialogs. */
export interface OdesliResult {
  spotify?: string
  appleMusic?: string
  soundcloud?: string
  youtube?: string
  bandcamp?: string
  deezer?: string
  tidal?: string
  amazonMusic?: string
  artwork?: string
  entityType?: string
}

/** Normalise Apple Music / iTunes URLs (geo redirects, affiliate params). */
export function cleanAppleMusicUrl(url: string): string {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname === 'geo.music.apple.com' || u.hostname.endsWith('.music.apple.com')) {
      u.hostname = 'music.apple.com'
    }
    return `${u.origin}${u.pathname}`
  } catch {
    return url
  }
}

export function extractStreamingLinksFromOdesli(data: OdesliResponse): OdesliFetchResult {
  const p = data.linksByPlatform
  if (!p) return { links: [] }

  let entityType: string | undefined
  let artwork: string | undefined
  if (data.entityUniqueId && data.entitiesByUniqueId) {
    const entity = data.entitiesByUniqueId[data.entityUniqueId]
    entityType = entity?.type
    artwork = entity?.thumbnailUrl
  }

  const links: StreamingLink[] = []
  for (const [key, link] of Object.entries(p)) {
    if (!link?.url) continue
    const platform = PLATFORM_NAME_MAP[key] ?? key
    const url = key === 'appleMusic' ? cleanAppleMusicUrl(link.url) : link.url
    links.push({ platform, url })
  }

  return { links, entityType, artwork }
}

export function flattenOdesliResult(result: OdesliFetchResult): OdesliResult {
  const flat: OdesliResult = {}
  for (const link of result.links) {
    const key = link.platform as keyof OdesliResult
    if (!(key in flat) || !flat[key]) {
      ;(flat as Record<string, string>)[link.platform] = link.url
    }
  }
  if (result.entityType) flat.entityType = result.entityType
  if (result.artwork) flat.artwork = result.artwork
  return flat
}

/** Server-side Odesli fetch (song.link API). */
export async function fetchOdesliLinksFromApi(lookupUrl: string): Promise<OdesliFetchResult> {
  if (!lookupUrl.trim()) return { links: [] }

  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(lookupUrl)}&userCountry=US`
  const response = await fetchWithRetry(apiUrl, { cache: 'no-store' })
  if (!response.ok) return { links: [] }

  const data = (await response.json()) as OdesliResponse
  return extractStreamingLinksFromOdesli(data)
}

const ODESLI_REQUEST_DELAY_MS = 6000

interface QueueEntry {
  url: string
  resolve: (value: OdesliResult | null) => void
}

const requestQueue: QueueEntry[] = []
let queueRunning = false

async function runQueue(): Promise<void> {
  if (queueRunning) return
  queueRunning = true
  while (requestQueue.length > 0) {
    const entry = requestQueue.shift()
    if (!entry) break
    entry.resolve(await fetchOdesliLinksViaProxy(entry.url))
    if (requestQueue.length > 0) {
      await new Promise<void>((res) => setTimeout(res, ODESLI_REQUEST_DELAY_MS))
    }
  }
  queueRunning = false
}

async function fetchOdesliLinksViaProxy(streamingUrl: string): Promise<OdesliResult | null> {
  try {
    const response = await fetch(`/api/odesli?url=${encodeURIComponent(streamingUrl)}&userCountry=DE`)
    if (!response.ok) return null

    const data = (await response.json()) as OdesliResponse
    return flattenOdesliResult(extractStreamingLinksFromOdesli(data))
  } catch {
    return null
  }
}

/** Client-side Odesli fetch via `/api/odesli` proxy (rate-limited queue). */
export function fetchOdesliLinks(streamingUrl: string): Promise<OdesliResult | null> {
  return new Promise<OdesliResult | null>((resolve) => {
    requestQueue.push({ url: streamingUrl, resolve })
    void runQueue().catch(() => resolve(null))
  })
}