/**
 * Client-side self-heal for R2 media that 404s (stale key/host after a bucket
 * move). Keeps media on the CDN (no per-load proxy); only fires on an actual
 * load error, and uses the read-only `/api/media-fix` lookup to find the
 * corrected URL. Does nothing on success, on the same URL twice (loop guard),
 * or when the lookup finds no better match.
 */

export interface MediaImageFallbackOptions {
  /** Only attempt repair when the URL belongs to the R2 public host. Default true. */
  r2Only?: boolean
}

const R2_HOST_RE = /^([a-z0-9-]+\.)*r2\.(cloudflarestorage\.com|dev)$/i

export function isR2Url(url: string): boolean {
  try {
    return R2_HOST_RE.test(new URL(url).hostname)
  } catch {
    return false
  }
}

export function objectPathFromUrl(url: string): string | null {
  const u = new URL(url)
  if (u.hostname.endsWith('.r2.cloudflarestorage.com')) {
    // <bucket>/<key> — drop the bucket prefix.
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments.length > 1) {
      const [, ...rest] = segments
      return rest.map(encodeURIComponent).join('/')
    }
    return null
  }
  return u.pathname.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')
}

/**
 * Attach to `<img onError={(e) => onMediaImageError(e)}>`. On an R2 404 it
 * swaps `src` to the repaired URL once. Returns true if a repair was triggered.
 */
export async function onMediaImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  options: MediaImageFallbackOptions = {},
): Promise<boolean> {
  const img = event.currentTarget
  const failed = img.src
  if (!failed) return false
  if (options.r2Only !== false && !isR2Url(failed)) return false
  // Loop guard: never retry the same src we just pointed at.
  if (img.dataset.mediaRepaired === '1') return false

  const path = objectPathFromUrl(failed)
  if (!path) return false

  try {
    const res = await fetch(`/api/media-fix?path=${encodeURIComponent(path)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { ok: boolean; url?: string | null }
    if (!data.ok || !data.url || data.url === failed) return false

    img.dataset.mediaRepaired = '1'
    img.src = data.url
    return true
  } catch {
    return false
  }
}
