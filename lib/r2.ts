import { normalizeR2PublicHost, rewriteR2MediaUrl } from '@/lib/r2-url-rewrite'

/**
 * Builds a public Cloudflare R2 URL from a storage object path.
 * Falls back to null when R2_PUBLIC_HOST is not configured.
 */
export function r2Url(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null
  const host = process.env.R2_PUBLIC_HOST
  if (!host) return null
  return `${host.replace(/\/$/, '')}/${storagePath}`
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
  const origin = normalizeR2PublicHost(process.env.R2_PUBLIC_HOST ?? '')
  if (!origin) return fallbackUrl
  return rewriteR2MediaUrl(fallbackUrl, origin, {
    mediaBucket: process.env.R2_BUCKET_MEDIA,
  }) ?? fallbackUrl
}
