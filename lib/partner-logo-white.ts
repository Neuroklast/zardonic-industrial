/** Minimal pixel buffer — avoids relying on the browser ImageData constructor in tests. */
export interface RgbaBuffer {
  data: Uint8ClampedArray
  width: number
  height: number
}

function sampleCornerLuminance(data: Uint8ClampedArray, width: number, height: number): {
  avgLum: number
  opaqueSamples: number
  transparentSamples: number
} {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
  ]
  let lumSum = 0
  let opaque = 0
  let transparent = 0

  for (const [x, y] of points) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue
    const i = (y * width + x) * 4
    const a = data[i + 3]
    if (a < 12) {
      transparent += 1
      continue
    }
    lumSum += (data[i] + data[i + 1] + data[i + 2]) / 3
    opaque += 1
  }

  return {
    avgLum: opaque > 0 ? lumSum / opaque : 0,
    opaqueSamples: opaque,
    transparentSamples: transparent,
  }
}

/**
 * Process a partner logo into a white silhouette while preserving / recovering alpha.
 *
 * Handles common upload styles:
 * 1. Any mark on true transparent PNG/SVG → keep alpha, RGB white
 *    (white, gold, gray, multi-colour — only transparent stays transparent)
 * 2. Dark mark on opaque white box → inverse luminance alpha (kills the white box)
 * 3. Light mark on opaque dark plate (e.g. white SEGA on black) → direct luminance
 *    alpha (kills the dark plate). Inverse would paint a solid white rectangle.
 *
 * Never kill near-white pixels on soft-alpha assets: white ink on transparent
 * (AEW white text, pre-whitened uploads) is the logo, not a plate.
 */
export function processLogoToWhiteSilhouette(
  imageData: RgbaBuffer,
  options?: { whiteThreshold?: number },
): RgbaBuffer {
  const whiteThreshold = options?.whiteThreshold ?? 232
  const darkThreshold = 255 - whiteThreshold
  const { data, width, height } = imageData
  const out = new Uint8ClampedArray(data.length)

  let alphaMin = 255
  let alphaMax = 0
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i]
    if (a < alphaMin) alphaMin = a
    if (a > alphaMax) alphaMax = a
  }
  const hasSoftAlpha = alphaMax - alphaMin > 24 && alphaMin < 240

  const corners = sampleCornerLuminance(data, width, height)
  const lightBackground =
    corners.opaqueSamples > 0 &&
    corners.avgLum >= whiteThreshold - 12 &&
    corners.transparentSamples < corners.opaqueSamples

  // Only treat as dark plate when corners are dark AND a light mark exists in-frame.
  // Pure black marks (no light content) must still use inverse luminance, not go transparent.
  let hasLightContent = false
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 12) continue
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (lum >= whiteThreshold - 40) {
      hasLightContent = true
      break
    }
  }
  const darkBackground =
    !lightBackground &&
    hasLightContent &&
    corners.opaqueSamples > 0 &&
    corners.avgLum <= darkThreshold + 12 &&
    corners.transparentSamples < corners.opaqueSamples

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    const lum = (r + g + b) / 3
    const srcA = a / 255

    let outA: number

    if (srcA < 0.02) {
      // Only true transparency stays transparent
      outA = 0
    } else if (lightBackground) {
      // Opaque light plate: plate → transparent; every other colour (black, gold, gray…) → solid white.
      // Soft inverse would leave gold A/W half-faded; brand multi-colour must read as one white mark.
      outA = lum >= whiteThreshold ? 0 : srcA
    } else if (darkBackground) {
      // Opaque dark plate + light mark (SEGA-style): plate → transparent; marks → solid white.
      // Inverse here would paint a solid white rectangle with logo-shaped holes.
      outA = lum <= darkThreshold ? 0 : srcA
    } else if (!hasSoftAlpha) {
      // Fully opaque, no clear plate — inverse luminance recovers a dark mark on unknown fill
      const knee = whiteThreshold
      const darkness = Math.max(0, (knee - lum) / knee)
      outA = Math.pow(darkness, 0.9) * srcA
      if (lum >= knee) outA = 0
    } else {
      // True alpha (transparent PNG/SVG): every non-transparent pixel → pure white.
      // White, gold, gray brand colours all keep their alpha — do not strip white ink.
      outA = srcA
    }

    out[i] = 255
    out[i + 1] = 255
    out[i + 2] = 255
    out[i + 3] = Math.round(Math.min(1, Math.max(0, outA)) * 255)
  }

  return { data: out, width, height }
}

/** Raster size for white-fill canvas: upscale tiny SVG defaults, cap huge assets. */
export const PARTNER_LOGO_RASTER_MIN = 512
export const PARTNER_LOGO_RASTER_MAX = 1024

export function isSvgLogoUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:image/svg+xml')) return true
  try {
    const path = url.startsWith('data:') || url.startsWith('blob:')
      ? url
      : new URL(url, 'https://local.test').pathname
    return /\.svg$/i.test(path)
  } catch {
    return /\.svg(\?|#|$)/i.test(url)
  }
}

export function isDirectCanvasHost(url: string): boolean {
  if (!url) return false
  if (url.startsWith('/') || url.startsWith('.') || url.startsWith('data:') || url.startsWith('blob:')) {
    return true
  }
  try {
    const hostname = new URL(url).hostname
    return (
      hostname.endsWith('.r2.dev') ||
      hostname.endsWith('.r2.cloudflarestorage.com') ||
      hostname.endsWith('.supabase.co')
    )
  } catch {
    return false
  }
}

export function logoRasterSize(
  width: number,
  height: number,
  minSide = PARTNER_LOGO_RASTER_MIN,
  maxSide = PARTNER_LOGO_RASTER_MAX,
): { width: number; height: number } {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const longest = Math.max(w, h)
  let scale = 1
  if (longest < minSide) scale = minSide / longest
  else if (longest > maxSide) scale = maxSide / longest
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  }
}

/**
 * Force an SVG to a large explicit width/height so <img> / canvas rasterize
 * at retina size. Tiny width="155" (Baby Audio) or missing size (default 300)
 * is what made partner SVGs look blurry after white-fill.
 */
export function rewriteSvgForHiResRaster(
  svgText: string,
  targetMaxSide = PARTNER_LOGO_RASTER_MAX,
): string {
  const viewBox = svgText.match(
    /viewBox\s*=\s*["']\s*([+-]?[\d.]+(?:[eE][+-]?\d+)?)\s+([+-]?[\d.]+(?:[eE][+-]?\d+)?)\s+([+-]?[\d.]+(?:[eE][+-]?\d+)?)\s+([+-]?[\d.]+(?:[eE][+-]?\d+)?)\s*["']/i,
  )
  const widthAttr = svgText.match(/<svg\b[^>]*\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i)
  const heightAttr = svgText.match(/<svg\b[^>]*\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i)

  const vbW = viewBox ? Math.abs(parseFloat(viewBox[3])) : 0
  const vbH = viewBox ? Math.abs(parseFloat(viewBox[4])) : 0
  const srcW = (vbW || (widthAttr ? parseFloat(widthAttr[1]) : 0) || targetMaxSide)
  const srcH = (vbH || (heightAttr ? parseFloat(heightAttr[1]) : 0) || targetMaxSide)
  const { width, height } = logoRasterSize(srcW, srcH, targetMaxSide, targetMaxSide)

  return svgText.replace(/(<svg\b)([^>]*)(>)/i, (_m, open: string, attrs: string, close: string) => {
    let next = attrs
      .replace(/\swidth\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\sheight\s*=\s*["'][^"']*["']/gi, '')
    if (!/viewBox\s*=/i.test(next) && srcW && srcH) {
      next += ` viewBox="0 0 ${srcW} ${srcH}"`
    }
    next += ` width="${width}" height="${height}"`
    return `${open}${next}${close}`
  })
}

/** Same-origin rewrite so the browser never fetch()es r2.dev (no CORS headers). */
export function partnerLogoProxyPath(url: string): string {
  return `/api/partner-logo?url=${encodeURIComponent(url)}`
}

/** Remote SVG on R2 / Supabase — must be rewritten via our origin, not fetched cross-origin. */
export function shouldProxyPartnerLogo(url: string): boolean {
  if (!url || !isSvgLogoUrl(url)) return false
  if (url.startsWith('/') || url.startsWith('.') || url.startsWith('data:') || url.startsWith('blob:')) {
    return false
  }
  return isDirectCanvasHost(url)
}

/** Validate `?url=` for `/api/partner-logo`. Rejects anything we would not proxy. */
export function parsePartnerLogoProxyUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') return null
    if (!shouldProxyPartnerLogo(parsed.toString())) return null
    return parsed.toString()
  } catch {
    return null
  }
}

/** Force CORS-safe load URL via wsrv so canvas / fetch is not tainted. */
export function partnerLogoCanvasSrc(url: string): string {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/') || url.startsWith('.')) return url
  // Public r2.dev does not send Access-Control-Allow-Origin. SVGs stay vectors via
  // same-origin rewrite; rasters go through wsrv (output=png at 1024 would smash SVG).
  if (shouldProxyPartnerLogo(url)) return partnerLogoProxyPath(url)

  if (url.startsWith('https://wsrv.nl/')) {
    const joiner = url.includes('?') ? '&' : '?'
    let next = url
    if (!/[?&]output=/.test(next)) next += `${joiner}output=png`
    if (!/[?&]n=/.test(next)) next += '&n=-1'
    if (!/[?&]w=/.test(next)) next += `&w=${PARTNER_LOGO_RASTER_MAX}`
    return next
  }

  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png&n=-1&w=${PARTNER_LOGO_RASTER_MAX}`
}

async function fetchLogoResource(url: string): Promise<Response> {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error(`logo fetch ${res.status}`)
  return res
}

/** SVG as a high-res blob URL so <img> stays a vector at display × DPR. */
export async function preparePartnerLogoSrc(url: string): Promise<string> {
  if (!url || !isSvgLogoUrl(url)) return url
  if (shouldProxyPartnerLogo(url)) return partnerLogoProxyPath(url)
  const fetchUrl = url
  try {
    const res = await fetchLogoResource(fetchUrl)
    const text = await res.text()
    if (!/<svg/i.test(text)) return url
    const rewritten = rewriteSvgForHiResRaster(text)
    const blob = new Blob([rewritten], { type: 'image/svg+xml' })
    return URL.createObjectURL(blob)
  } catch {
    return url
  }
}

/**
 * Load image pixels via fetch→blob so canvas is never CORS-tainted
 * (more reliable than Image.crossOrigin for third-party CDNs).
 */
export async function loadLogoImageForCanvas(url: string): Promise<HTMLImageElement> {
  if (isSvgLogoUrl(url)) {
    try {
      const hiRes = await preparePartnerLogoSrc(url)
      return await loadImageElement(hiRes, false)
    } catch {
      // fall through to raster proxy
    }
  }

  const src = partnerLogoCanvasSrc(url)

  // Relative / same-origin can load directly
  if (src.startsWith('/') || src.startsWith('.') || src.startsWith('data:') || src.startsWith('blob:')) {
    return loadImageElement(src, false)
  }

  try {
    const res = await fetchLogoResource(src)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    try {
      return await loadImageElement(objectUrl, false)
    } finally {
      // Delay revoke until after draw — caller draws sync after await
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
    }
  } catch {
    // Last resort: crossOrigin image load
    return loadImageElement(src, true)
  }
}

function loadImageElement(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('logo image load failed'))
    img.src = src
  })
}
