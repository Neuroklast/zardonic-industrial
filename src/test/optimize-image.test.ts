import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import {
  DEFAULT_MAX_IMAGE_WIDTH,
  optimizeImageBuffer,
  shouldSkipImageOptimization,
} from '@/lib/optimize-image'

describe('optimize-image', () => {
  it('skips svg and gif optimization', () => {
    expect(shouldSkipImageOptimization('image/svg+xml')).toBe(true)
    expect(shouldSkipImageOptimization('image/gif')).toBe(true)
    expect(shouldSkipImageOptimization('image/jpeg')).toBe(false)
  })

  it('resizes large raster images and outputs webp', async () => {
    const source = await sharp({
      create: {
        width: 4000,
        height: 2000,
        channels: 3,
        background: { r: 120, g: 40, b: 200 },
      },
    })
      .jpeg()
      .toBuffer()

    const result = await optimizeImageBuffer(source, 'image/jpeg', {
      maxWidth: DEFAULT_MAX_IMAGE_WIDTH,
      maxHeight: DEFAULT_MAX_IMAGE_WIDTH,
    })

    expect(result.contentType).toBe('image/webp')
    expect(result.extension).toBe('webp')

    const meta = await sharp(result.buffer).metadata()
    expect(meta.width).toBeLessThanOrEqual(DEFAULT_MAX_IMAGE_WIDTH)
    expect(meta.height).toBeLessThanOrEqual(DEFAULT_MAX_IMAGE_WIDTH)
  })

  it('preserves png with alpha as webp', async () => {
    const source = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer()

    const result = await optimizeImageBuffer(source, 'image/png')
    expect(result.contentType).toBe('image/webp')
    const meta = await sharp(result.buffer).metadata()
    expect(meta.width).toBe(800)
  })
})