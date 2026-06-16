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
 */
export function resolveImageUrl(
  storagePath: string | null | undefined,
  fallbackUrl: string | null | undefined,
): string | null {
  return r2Url(storagePath) ?? fallbackUrl ?? null
}
