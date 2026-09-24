import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { renderPartnerLogoWhitePng } from '@/lib/partner-logo-white-server'

describe('renderPartnerLogoWhitePng', () => {
  it('turns opaque black pixels into white PNG ink', async () => {
    const source = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    const out = await renderPartnerLogoWhitePng(source, false)
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    expect(info.channels).toBe(4)
    expect(data[0]).toBe(255)
    expect(data[1]).toBe(255)
    expect(data[2]).toBe(255)
    expect(data[3]).toBeGreaterThan(200)
  })

  it('keeps SVG transparency and whitens ink', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><rect x="2" y="2" width="4" height="4" fill="#c5ab57"/></svg>'
    const out = await renderPartnerLogoWhitePng(Buffer.from(svg, 'utf8'), true)
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    expect(info.width).toBeGreaterThan(1)
    let sawWhite = false
    let sawClear = false
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) sawClear = true
      if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255 && data[i + 3] > 200) {
        sawWhite = true
      }
    }
    expect(sawWhite).toBe(true)
    expect(sawClear).toBe(true)
  })
})
