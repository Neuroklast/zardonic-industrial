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
 * 1. Dark mark on true transparent PNG → keep alpha, RGB white
 * 2. Dark mark on opaque white box → inverse luminance alpha (kills the white box)
 * 3. Already-white mark on transparent → keep alpha, RGB white
 * 4. Light mark on opaque dark plate (e.g. white SEGA on black) → direct luminance
 *    alpha (kills the dark plate). Inverse would paint a solid white rectangle.
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
      outA = 0
    } else if (lightBackground) {
      // Opaque light plate: darkness becomes white logo alpha
      const knee = whiteThreshold
      const darkness = Math.max(0, (knee - lum) / knee)
      outA = Math.pow(darkness, 0.9) * srcA
      if (lum >= knee) outA = 0
    } else if (darkBackground) {
      // Opaque dark plate + light mark (SEGA-style): brightness becomes alpha
      // Inverse here would paint a solid white rectangle with logo-shaped holes.
      const span = Math.max(1, 255 - darkThreshold)
      const brightness = Math.max(0, (lum - darkThreshold) / span)
      outA = Math.pow(brightness, 0.9) * srcA
      if (lum <= darkThreshold) outA = 0
    } else if (!hasSoftAlpha) {
      // Opaque dark mark without a light plate — classic inverse silhouette
      const knee = whiteThreshold
      const darkness = Math.max(0, (knee - lum) / knee)
      outA = Math.pow(darkness, 0.9) * srcA
      if (lum >= knee) outA = 0
    } else if (lum >= whiteThreshold && srcA > 0.9) {
      // True-alpha asset with leftover near-white pixels
      outA = 0
    } else {
      outA = srcA
    }

    out[i] = 255
    out[i + 1] = 255
    out[i + 2] = 255
    out[i + 3] = Math.round(Math.min(1, Math.max(0, outA)) * 255)
  }

  return { data: out, width, height }
}

/** Force CORS-safe load URL via wsrv so canvas / fetch is not tainted. */
export function partnerLogoCanvasSrc(url: string): string {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/') || url.startsWith('.')) return url

  if (url.startsWith('https://wsrv.nl/')) {
    const joiner = url.includes('?') ? '&' : '?'
    let next = url
    if (!/[?&]output=/.test(next)) next += `${joiner}output=png`
    if (!/[?&]n=/.test(next)) next += '&n=-1'
    return next
  }

  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png&n=-1`
}

/**
 * Load image pixels via fetch→blob so canvas is never CORS-tainted
 * (more reliable than Image.crossOrigin for third-party CDNs).
 */
export async function loadLogoImageForCanvas(url: string): Promise<HTMLImageElement> {
  const src = partnerLogoCanvasSrc(url)

  // Relative / same-origin can load directly
  if (src.startsWith('/') || src.startsWith('.') || src.startsWith('data:') || src.startsWith('blob:')) {
    return loadImageElement(src, false)
  }

  try {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error(`logo fetch ${res.status}`)
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
