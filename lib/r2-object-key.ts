/**
 * Content-addressed R2 object keys.
 *
 * Uploads previously stored `${prefix}/${Date.now()}.${ext}` (or a
 * `-${Date.now()}` suffix on signed PUTs), so the same asset got a NEW key on
 * every upload. After a bucket move the DB kept pointing at a timestamped key
 * that no longer existed → stale refs / 404s.
 *
 * With this module every object key is derived from the sha256 of the exact
 * bytes that are stored:
 *   `${sanitizeStoragePrefix(prefix)}/${HASH}.${ext}`
 *
 * Same content → same key → the DB reference stays valid forever and is
 * bucket-agnostic (only the public host changes, which `canonicalizeR2MediaUrl`
 * already rewrites at render time). Different content → different key, so the
 * existing "replace deletes the previous R2 object" logic still works (the new
 * path differs from the old one).
 *
 * Uses Web Crypto (`globalThis.crypto.subtle`), available in modern browsers
 * and Node 20+, so the same helper works client-side (browser-signed PUT,
 * multipart) and server-side (server actions).
 */

export const DEFAULT_CONTENT_HASH_BYTES = 16 // 128-bit / 32 hex chars
const MAX_CONTENT_HASH_HEX = 64
const EXT_RE = /\.([a-z0-9]+)$/i
const TIMESTAMP_RE = /^\d{10,}$/

export function sanitizeStoragePrefix(prefix: string): string {
  return prefix.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'uploads'
}

export function safeExtension(extension: string | null | undefined): string {
  const cleaned = (extension ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase()
  return cleaned || 'bin'
}

async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('Web Crypto is not available')
  const bytes: BufferSource =
    data instanceof Uint8Array ? (data as unknown as BufferSource) : new Uint8Array(data)
  const digest = await subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Build a deterministic content-addressed object key from the bytes that will
 * be stored. `hashLength` is the number of hex chars (defaults to a 128-bit
 * hash — ample for media dedupe; pass 64 for a full sha256).
 */
export async function contentObjectKey(args: {
  prefix: string
  data: ArrayBuffer | Uint8Array
  extension?: string | null
  hashLength?: number
}): Promise<string> {
  const hash = await sha256Hex(args.data)
  const length = args.hashLength ?? DEFAULT_CONTENT_HASH_BYTES * 2
  const safeLen = Math.max(8, Math.min(length, MAX_CONTENT_HASH_HEX))
  const short = hash.slice(0, safeLen)
  return `${sanitizeStoragePrefix(args.prefix)}/${short}.${safeExtension(args.extension)}`
}

/**
 * Extract the content hash from a content-addressed key (`prefix/<hash>.ext`),
 * or null if the stem is not a content hash (e.g. a legacy timestamped key
 * like `prefix/1735390000000.webp` or a human filename).
 */
export function contentHashFromKey(key: string): string | null {
  const base = key.replace(/\/+$/, '').split('/').pop() ?? ''
  const stem = base.replace(EXT_RE, '')
  if (/^[0-9a-f]{8,64}$/i.test(stem) && !TIMESTAMP_RE.test(stem) && stem.replace(/[0-9]/g, '')) {
    return stem.toLowerCase()
  }
  return null
}


