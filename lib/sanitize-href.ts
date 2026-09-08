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

/**
 * Same-origin paths (`/legal-notice`) plus http(s) URLs.
 * Use for footer/legal links that default to internal routes.
 * `sanitizeExternalHref` alone strips those paths (new URL('/x') throws),
 * which rendered `<a>` without href — visible but not clickable.
 */
export function sanitizeHref(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    for (let i = 0; i < trimmed.length; i++) {
      const code = trimmed.charCodeAt(i)
      if (code <= 0x1f || code === 0x7f) return undefined
    }
    return trimmed
  }
  return sanitizeExternalHref(trimmed)
}
