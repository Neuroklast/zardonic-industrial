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

/** Default market for Odesli link resolution. */
export const ODESLI_DEFAULT_COUNTRY = 'US'

/** Server-side Odesli fetch (song.link API). */
export async function fetchOdesliLinksFromApi(
  lookupUrl: string,
  userCountry: string = ODESLI_DEFAULT_COUNTRY,
): Promise<OdesliFetchResult> {
  if (!lookupUrl.trim()) return { links: [] }

  const country = userCountry.trim() || ODESLI_DEFAULT_COUNTRY
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(lookupUrl)}&userCountry=${encodeURIComponent(country)}`
  const response = await fetchWithRetry(apiUrl, { cache: 'no-store' })
  if (!response.ok) return { links: [] }

  const data = (await response.json()) as OdesliResponse
  return extractStreamingLinksFromOdesli(data)
}