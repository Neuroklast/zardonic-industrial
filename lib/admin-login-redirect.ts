/** Same-origin path only. `//evil.com` and `/\evil.com` are other hosts after URL parsing. */
export function safeAdminRedirect(value: string, base: string): string {
  const fallback = '/admin'
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('\0')) {
    return fallback
  }
  try {
    const origin = new URL(base).origin
    const url = new URL(value, base)
    if (url.origin !== origin) return fallback
    const path = `${url.pathname}${url.search}${url.hash}`
    // `/.//evil.com` serializes to pathname `//evil.com`, which the next parse treats as another host.
    if (!path.startsWith('/') || path.startsWith('//')) return fallback
    if (new URL(path, base).origin !== origin) return fallback
    return path
  } catch {
    return fallback
  }
}

