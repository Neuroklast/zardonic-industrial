import { MEDIA_BUCKET } from '@/lib/constants'
import { getStorageProvider } from '@/lib/storage'
import { fetchItunesItemById } from '@/lib/itunes-sync'
import { fetchReleaseMetadataFromSpotify } from '@/lib/spotify-sync'
import { fetchReleaseMetadataFromDiscogs } from '@/lib/discogs-sync'
import type { ExternalReleaseSource } from '@/lib/release-external-ids'

/** Fields a release row exposes that are used to resolve a cover source. */
export interface ReleaseCoverSourceFields {
  itunes_id?: string | null
  spotify_id?: string | null
  discogs_id?: string | null
}

export interface BestCoverSource {
  url: string
  source: ExternalReleaseSource
  externalId: string
}

/**
 * Resolve the highest-priority cover for a release: iTunes → Spotify → Discogs.
 * Returns null when the release is coverless with no reachable artwork.
 */
export async function resolveBestCoverSource(
  fields: ReleaseCoverSourceFields,
): Promise<BestCoverSource | null> {
  if (fields.itunes_id) {
    const item = await fetchItunesItemById(fields.itunes_id)
    const url = item?.artworkUrl100?.replace('100x100bb', '1000x1000bb')
    if (url) return { url, source: 'itunes', externalId: fields.itunes_id }
  }

  if (fields.spotify_id) {
    const meta = await fetchReleaseMetadataFromSpotify(fields.spotify_id)
    if (meta?.coverUrl) return { url: meta.coverUrl, source: 'spotify', externalId: fields.spotify_id }
  }

  if (fields.discogs_id) {
    const meta = await fetchReleaseMetadataFromDiscogs(fields.discogs_id)
    if (meta?.coverUrl) return { url: meta.coverUrl, source: 'discogs', externalId: fields.discogs_id }
  }

  return null
}

const RELEASE_COVER_PREFIX = 'releases/'

function normalizePath(path: string): string | null {
  const trimmed = path.trim()
  if (!trimmed.startsWith(RELEASE_COVER_PREFIX)) return null
  return trimmed
}

/** Delete orphaned release cover objects from R2 after consolidation or replacement. */
export async function deleteReleaseCoversFromR2(
  paths: Iterable<string>,
): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  let storage: ReturnType<typeof getStorageProvider> | null = null
  try {
    storage = getStorageProvider()
  } catch {
    return { deleted, errors }
  }

  for (const raw of paths) {
    const path = normalizePath(raw)
    if (!path || seen.has(path)) continue
    seen.add(path)

    try {
      await storage.deleteObject(MEDIA_BUCKET, path)
      deleted.push(path)
    } catch {
      errors.push(path)
    }
  }

  return { deleted, errors }
}

export interface CachedReleaseCover {
  cover_storage_path: string
  cover_url: string
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function extForUrl(url: string, contentType: string): string {
  const mime = (contentType || '').split(';')[0].trim().toLowerCase()
  const fromMime = EXT_BY_MIME[mime]
  if (fromMime) return fromMime

  const clean = url.split(/[?#]/, 1)[0]?.toLowerCase() ?? ''
  const match = clean.match(/\.(jpe?g|png|webp|avif)$/)
  const ext = match?.[1]
  if (!ext) return 'jpg'
  return ext === 'jpeg' ? 'jpg' : ext
}

/**
 * Download artwork from a streaming platform and store it on R2 under
 * `releases/{source}-{externalId}.{ext}` (content-type/extension derived from
 * the actual response). Returns the R2 path + public URL, or null on any
 * failure (caller falls back to the raw source URL).
 *
 * Usable from both server actions and the browser-less sync job runner (no
 * `requireAdmin`, no session).
 */
export async function cacheReleaseCoverToR2(
  coverUrl: string,
  source: ExternalReleaseSource,
  externalId: string,
): Promise<CachedReleaseCover | null> {
  if (!process.env.R2_ACCOUNT_ID) return null

  let storage: ReturnType<typeof getStorageProvider> | null = null
  try {
    storage = getStorageProvider()
  } catch {
    return null
  }

  try {
    const res = await fetch(coverUrl, { cache: 'no-store' })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length === 0) return null

    const ext = extForUrl(coverUrl, contentType)
    const objectPath = `${RELEASE_COVER_PREFIX}${source}-${externalId}.${ext}`

    await storage.uploadObject(MEDIA_BUCKET, objectPath, buffer, contentType)

    let publicUrl: string
    try {
      publicUrl = storage.getPublicUrl(MEDIA_BUCKET, objectPath)
    } catch {
      publicUrl = coverUrl
    }

    return { cover_storage_path: objectPath, cover_url: publicUrl }
  } catch {
    return null
  }
}
