import { canonicalizeR2MediaUrl, currentR2PublicOrigin } from '@/lib/r2-url-rewrite'

/**
 * Builds a public Cloudflare R2 URL from a storage object path.
 * Falls back to null when R2_PUBLIC_HOST is not configured.
 */
export function r2Url(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null
  const origin = currentR2PublicOrigin()
  if (!origin) return null
  return `${origin}/${storagePath.replace(/^\/+/, '')}`
}

/**
 * Resolves the best available public URL for a record that has both
 * a storage path (R2) and a legacy fallback URL.
 *
 * Fallback URLs that still point at an old `*.r2.dev` host (or a wsrv.nl
 * wrapper of one) are rebuilt onto the current `R2_PUBLIC_HOST`.
 */
export function resolveImageUrl(
  storagePath: string | null | undefined,
  fallbackUrl: string | null | undefined,
): string | null {
  const fromPath = r2Url(storagePath)
  if (fromPath) return fromPath
  if (!fallbackUrl) return null
  return canonicalizeR2MediaUrl(fallbackUrl)
}
