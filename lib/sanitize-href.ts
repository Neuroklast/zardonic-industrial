/**
 * Pure runtime URL sanitizer — safe to import into client components
 * (no server-only or zod dependencies).
 */
export function sanitizeExternalHref(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    if (url.protocol === 'https:' || url.protocol === 'http:') return raw
  } catch {
    // Not a parseable URL — treat as unsafe.
  }
  return undefined
}
