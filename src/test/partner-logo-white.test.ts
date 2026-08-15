import { describe, expect, it } from 'vitest'
import {
  isSvgLogoUrl,
  logoRasterSize,
  parsePartnerLogoProxyUrl,
  partnerLogoCanvasSrc,
  partnerLogoProxyPath,
  processLogoToWhiteSilhouette,
  rewriteSvgForHiResRaster,
  shouldProxyPartnerLogo,
} from '@/lib/partner-logo-white'

function makeImageData(
  pixels: Array<[number, number, number, number]>,
  width = pixels.length,
  height = 1,
) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < pixels.length; i++) {
    const [r, g, b, a] = pixels[i]
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = a
  }
  return { data, width, height }
}

/** 3×3 plate: white corners, black center (QUESTEC-style white box) */
function makeWhiteBoxLogo() {
  const w = 3
  const h = 3
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const isCenter = x === 1 && y === 1
      data[i] = isCenter ? 20 : 255
      data[i + 1] = isCenter ? 20 : 255
      data[i + 2] = isCenter ? 20 : 255
      data[i + 3] = 255
    }
  }
  return { data, width: w, height: h }
}

describe('processLogoToWhiteSilhouette', () => {
  it('keeps transparent pixels transparent', () => {
    const input = makeImageData([[0, 0, 0, 0]])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[3]).toBe(0)
  })

  it('turns black opaque logo pixels white with full alpha', () => {
    // No light plate — single dark pixel treated via inverse luminance
    const input = makeImageData([[0, 0, 0, 255]])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[0]).toBe(255)
    expect(out.data[1]).toBe(255)
    expect(out.data[2]).toBe(255)
    expect(out.data[3]).toBeGreaterThan(200)
  })

  it('strips near-white opaque backgrounds (no solid white box)', () => {
    const input = makeImageData([[255, 255, 255, 255]])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[3]).toBe(0)
  })

  it('kills white plate around a dark mark (QUESTEC-style)', () => {
    const input = makeWhiteBoxLogo()
    const out = processLogoToWhiteSilhouette(input)
    // Corners (white plate) must be fully transparent
    expect(out.data[3]).toBe(0)
    // Center (dark mark) must remain visible as white
    const center = (1 * 3 + 1) * 4
    expect(out.data[center]).toBe(255)
    expect(out.data[center + 3]).toBeGreaterThan(150)
  })

  it('kills dark plate around a light mark (SEGA-style white on black)', () => {
    // 3×3: black corners/plate, white center mark — inverse would paint a solid white box
    const w = 3
    const h = 3
    const data = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const isCenter = x === 1 && y === 1
        data[i] = isCenter ? 255 : 8
        data[i + 1] = isCenter ? 255 : 8
        data[i + 2] = isCenter ? 255 : 8
        data[i + 3] = 255
      }
    }
    const out = processLogoToWhiteSilhouette({ data, width: w, height: h })
    // Corners (dark plate) must be fully transparent — no solid white rectangle
    expect(out.data[3]).toBe(0)
    // Center (light mark) must remain visible as white
    const center = (1 * 3 + 1) * 4
    expect(out.data[center]).toBe(255)
    expect(out.data[center + 1]).toBe(255)
    expect(out.data[center + 2]).toBe(255)
    expect(out.data[center + 3]).toBeGreaterThan(150)
  })

  it('preserves partial alpha on non-white pixels', () => {
    // Soft alpha path: varied alpha in buffer
    const data = new Uint8ClampedArray(8)
    // pixel 0 transparent-ish dark
    data[0] = 10
    data[1] = 10
    data[2] = 10
    data[3] = 128
    // pixel 1 fully transparent
    data[4] = 0
    data[5] = 0
    data[6] = 0
    data[7] = 0
    const out = processLogoToWhiteSilhouette({ data, width: 2, height: 1 })
    expect(out.data[0]).toBe(255)
    expect(out.data[3]).toBe(128)
    expect(out.data[7]).toBe(0)
  })

  it('keeps a white wordmark that touches corners (PWM-style, no dark plate)', () => {
    // White PWM-style mark: transparency only in one corner counter-space.
    // Corner sampler sees mostly white and used to classify this as a light plate,
    // then strip every white pixel — the logo vanished on the dark site.
    const w = 3
    const h = 3
    const data = new Uint8ClampedArray(w * h * 4)
    const set = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) set(x, y, 255, 255, 255, 255)
    }
    set(0, 0, 0, 0, 0, 0)

    const out = processLogoToWhiteSilhouette({ data, width: w, height: h })
    expect(out.data[3]).toBe(0)
    const center = (1 * w + 1) * 4
    expect(out.data[center]).toBe(255)
    expect(out.data[center + 1]).toBe(255)
    expect(out.data[center + 2]).toBe(255)
    expect(out.data[center + 3]).toBe(255)
  })

  it('keeps already-white ink on transparent (must not disappear)', () => {
    // Pre-whitened / white-fill brand mark on real alpha — used to be killed as "leftover plate"
    const input = makeImageData([
      [255, 255, 255, 255],
      [0, 0, 0, 0],
    ])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[0]).toBe(255)
    expect(out.data[1]).toBe(255)
    expect(out.data[2]).toBe(255)
    expect(out.data[3]).toBe(255)
    expect(out.data[7]).toBe(0)
  })

  it('whitens multi-colour true-alpha logos (AEW-style white + gold + gray)', () => {
    // 3×3: transparent corners (real SVG plate), multi-colour mark in the centre row
    // AEW simplified: white ink + gold A/W (#c5ab57) + gray brackets (#7f7f7f)
    const w = 3
    const h = 3
    const data = new Uint8ClampedArray(w * h * 4)
    const set = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a
    }
    // transparent frame
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) set(x, y, 0, 0, 0, 0)
    }
    set(0, 1, 255, 255, 255, 255) // white ink
    set(1, 1, 197, 171, 87, 255) // gold A/W
    set(2, 1, 127, 127, 127, 255) // gray brackets

    const out = processLogoToWhiteSilhouette({ data, width: w, height: h })
    // Corners stay transparent
    expect(out.data[3]).toBe(0)
    // All three brand colours → solid white
    for (const x of [0, 1, 2]) {
      const i = (1 * w + x) * 4
      expect(out.data[i]).toBe(255)
      expect(out.data[i + 1]).toBe(255)
      expect(out.data[i + 2]).toBe(255)
      expect(out.data[i + 3]).toBe(255)
    }
  })
})

describe('partnerLogoCanvasSrc', () => {
  it('proxies remote URLs through wsrv for CORS canvas access at high res', () => {
    const src = partnerLogoCanvasSrc('https://cdn.example.com/logo.png')
    expect(src).toContain('https://wsrv.nl/?url=')
    expect(src).toContain('output=png')
    expect(src).toContain('w=1024')
  })

  it('leaves relative paths alone', () => {
    expect(partnerLogoCanvasSrc('/assets/logo.png')).toBe('/assets/logo.png')
  })

  it('proxies public R2 SVGs through same-origin rewrite (r2.dev has no CORS)', () => {
    const r2 = 'https://pub-example.r2.dev/partners/logos/baby.svg'
    expect(shouldProxyPartnerLogo(r2)).toBe(true)
    expect(partnerLogoCanvasSrc(r2)).toBe(partnerLogoProxyPath(r2))
    expect(partnerLogoCanvasSrc(r2)).toMatch(/^\/api\/partner-logo\?url=/)
  })

  it('sends public R2 rasters through wsrv (fetch/canvas need CORS)', () => {
    const r2 = 'https://pub-example.r2.dev/partners/logos/questec.png'
    expect(shouldProxyPartnerLogo(r2)).toBe(false)
    const src = partnerLogoCanvasSrc(r2)
    expect(src).toContain('https://wsrv.nl/?url=')
    expect(src).toContain('output=png')
  })

  it('does not proxy relative or data SVGs', () => {
    expect(shouldProxyPartnerLogo('/logos/a.svg')).toBe(false)
    expect(shouldProxyPartnerLogo('data:image/svg+xml,<svg></svg>')).toBe(false)
    expect(shouldProxyPartnerLogo('https://cdn.example.com/a.svg')).toBe(false)
  })

  it('parsePartnerLogoProxyUrl only allows https R2/Supabase SVGs', () => {
    const r2 = 'https://pub-example.r2.dev/partners/logos/baby.svg'
    expect(parsePartnerLogoProxyUrl(r2)).toBe(r2)
    expect(parsePartnerLogoProxyUrl('https://cdn.example.com/a.svg')).toBeNull()
    expect(parsePartnerLogoProxyUrl('https://pub-example.r2.dev/logo.png')).toBeNull()
    expect(parsePartnerLogoProxyUrl('http://pub-example.r2.dev/a.svg')).toBeNull()
    expect(parsePartnerLogoProxyUrl(null)).toBeNull()
  })
})

describe('logo raster helpers', () => {
  it('detects svg urls', () => {
    expect(isSvgLogoUrl('https://cdn.example.com/a.svg')).toBe(true)
    expect(isSvgLogoUrl('https://cdn.example.com/a.SVG?x=1')).toBe(true)
    expect(isSvgLogoUrl('https://cdn.example.com/a.png')).toBe(false)
    expect(isSvgLogoUrl('data:image/svg+xml,<svg></svg>')).toBe(true)
  })

  it('upsizes tiny rasters and caps huge ones', () => {
    expect(logoRasterSize(155, 18)).toEqual({ width: 512, height: 59 })
    expect(logoRasterSize(4000, 1000)).toEqual({ width: 1024, height: 256 })
    expect(logoRasterSize(800, 200)).toEqual({ width: 800, height: 200 })
  })

  it('rewrites tiny SVG width/height so rasterization is sharp', () => {
    const src =
      '<svg width="155" height="18" viewBox="0 0 155 18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
    const out = rewriteSvgForHiResRaster(src)
    expect(out).toContain('width="1024"')
    expect(out).toMatch(/height="119"/)
    expect(out).toContain('viewBox="0 0 155 18"')
  })

  it('assigns size from viewBox when width/height are missing', () => {
    const src =
      '<svg viewBox="0 0 6714 1642.2" xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
    const out = rewriteSvgForHiResRaster(src)
    expect(out).toContain('width="1024"')
    expect(out).toContain('height="250"')
  })
})
