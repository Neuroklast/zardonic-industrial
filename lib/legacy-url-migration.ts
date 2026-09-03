import { sanitizeStoragePrefix } from '@/lib/r2-object-key'

/**
 * Pure helpers for migrating legacy Supabase Storage URLs onto R2.
 *
 * Legacy rows (pre-R2 migration) carry `https://<ref>.supabase.co/storage/v1/
 * object/public/<bucket>/<key>` in their `*_url` columns. The migration script
 * (`scripts/r2-migrate-legacy-urls.ts`) uses these helpers to turn such a URL
 * into an R2 object key and a target prefix.
 */

const PUBLIC_OBJECT_RE =
  /\/storage\/v1\/object\/public\/([^/?#]+)\/([^?#]+)$/i

export interface SupabaseStorageObject {
  /** Supabase bucket the object lives in (mirrors the URL, not R2). */
  bucket: string
  /** Full object key as stored in Supabase Storage (no query string). */
  objectKey: string
  /** Extension derived from the object key, if any. */
  extension: string | null
}

/**
 * Extract the object key from a public Supabase Storage URL.
 * Returns null for anything that is not `.../storage/v1/object/public/<bucket>/<key>`.
 */
export function parseSupabaseStorageObject(
  url: string | null | undefined,
): SupabaseStorageObject | null {
  if (!url) return null
  let pathname: string
  try {
    pathname = new URL(url).pathname
  } catch {
    return null
  }
  const match = pathname.match(PUBLIC_OBJECT_RE)
  if (!match) return null
  let objectKey: string
  try {
    objectKey = decodeURIComponent(match[2].replace(/\/+$/, ''))
  } catch {
    return null
  }
  if (!objectKey) return null
  const extension = /\.([a-z0-9]+)$/i.test(objectKey)
    ? objectKey.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? null
    : null
  return { bucket: match[1], objectKey, extension }
}

/**
 * R2 prefix for a migrated object: preserves the legacy folder structure
 * (e.g. `images/foo.png` → `images/<hash>.png`). Falls back to a table-level
 * prefix when the legacy key has no folder.
 */
export function storagePrefixForObject(
  objectKey: string,
  fallbackPrefix: string,
): string {
  const slash = objectKey.lastIndexOf('/')
  const dir = slash > 0 ? objectKey.slice(0, slash) : ''
  return sanitizeStoragePrefix(dir || fallbackPrefix)
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  zip: 'application/zip',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  txt: 'text/plain',
}

export function mimeFromExtension(extension: string | null | undefined): string {
  const ext = (extension ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase()
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}
