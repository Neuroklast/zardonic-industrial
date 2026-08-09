/** Minimal pixel buffer — avoids relying on the browser ImageData constructor in tests. */
export interface RgbaBuffer {
  data: Uint8ClampedArray
  width: number
  height: number
}

/**
 * Process a partner logo into a white silhouette while preserving / recovering alpha.
 *
 * - Keeps real alpha when present (transparent stays transparent).
 * - Strips near-white opaque backgrounds (common “white rectangle” uploads).
 * - Uses inverse luminance as alpha for opaque dark logos on solid backgrounds.
 * - Outputs pure white RGB so logos sit cleanly on dark UI.
 */
export function processLogoToWhiteSilhouette(
  imageData: RgbaBuffer,
  options?: { whiteThreshold?: number },
): RgbaBuffer {
  const whiteThreshold = options?.whiteThreshold ?? 245
  const { data, width, height } = imageData
  const out = new Uint8ClampedArray(data.length)

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
    } else if (lum >= whiteThreshold && srcA > 0.85) {
      // Opaque / near-opaque white → treat as background
      outA = 0
    } else if (srcA < 0.98) {
      // Real transparency path
      outA = srcA
    } else {
      // Opaque non-white (e.g. black logo on solid field): dark = solid
      outA = Math.min(1, Math.max(0, 1 - lum / 255))
    }

    out[i] = 255
    out[i + 1] = 255
    out[i + 2] = 255
    out[i + 3] = Math.round(outA * 255)
  }

  return { data: out, width, height }
}

/** Force CORS-safe load URL via wsrv so canvas is not tainted. */
export function partnerLogoCanvasSrc(url: string): string {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/') || url.startsWith('.')) return url

  // Already wsrv
  if (url.startsWith('https://wsrv.nl/')) {
    const hasOutput = /[?&]output=/.test(url)
    return hasOutput ? url : `${url}${url.includes('?') ? '&' : '?'}output=png`
  }

  // Always proxy external (incl. R2) through wsrv for CORS + canvas
  const base = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png&n=-1`
  return base
}
