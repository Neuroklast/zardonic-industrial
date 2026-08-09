import { describe, expect, it } from 'vitest'
import {
  partnerLogoCanvasSrc,
  processLogoToWhiteSilhouette,
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

describe('processLogoToWhiteSilhouette', () => {
  it('keeps transparent pixels transparent', () => {
    const input = makeImageData([[0, 0, 0, 0]])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[3]).toBe(0)
  })

  it('turns black opaque logo pixels white with full alpha', () => {
    const input = makeImageData([[0, 0, 0, 255]])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[0]).toBe(255)
    expect(out.data[1]).toBe(255)
    expect(out.data[2]).toBe(255)
    expect(out.data[3]).toBe(255)
  })

  it('strips near-white opaque backgrounds (no solid white box)', () => {
    const input = makeImageData([[255, 255, 255, 255]])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[3]).toBe(0)
  })

  it('preserves partial alpha on non-white pixels', () => {
    const input = makeImageData([[10, 10, 10, 128]])
    const out = processLogoToWhiteSilhouette(input)
    expect(out.data[0]).toBe(255)
    expect(out.data[3]).toBe(128)
  })
})

describe('partnerLogoCanvasSrc', () => {
  it('proxies remote URLs through wsrv for CORS canvas access', () => {
    const src = partnerLogoCanvasSrc('https://cdn.example.com/logo.png')
    expect(src).toContain('https://wsrv.nl/?url=')
    expect(src).toContain('output=png')
  })

  it('leaves relative paths alone', () => {
    expect(partnerLogoCanvasSrc('/assets/logo.png')).toBe('/assets/logo.png')
  })
})
