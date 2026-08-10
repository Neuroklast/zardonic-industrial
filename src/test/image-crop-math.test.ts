import { describe, expect, it } from 'vitest'
import {
  clampCropState,
  computeBaseScale,
  computeDrawRect,
  resolveEditorViewport,
  resolveOutputSize,
  resolveSourceScale,
  shouldOpenImageEditor,
} from '@/lib/image-crop-math'

describe('image-crop-math', () => {
  it('computes cover base scale', () => {
    expect(computeBaseScale(2000, 1000, { width: 400, height: 400 }, 'cover')).toBe(0.4)
  })

  it('computes contain base scale', () => {
    expect(computeBaseScale(2000, 1000, { width: 400, height: 400 }, 'contain')).toBe(0.2)
  })

  it('centers image at default crop state', () => {
    const rect = computeDrawRect(1000, 500, { width: 400, height: 400 }, { scale: 1, offsetX: 0, offsetY: 0 }, 'cover')
    expect(rect.width).toBeGreaterThanOrEqual(400)
    expect(rect.height).toBeGreaterThanOrEqual(400)
    expect(rect.x).toBeLessThanOrEqual(0)
    expect(rect.y).toBeLessThanOrEqual(0)
  })

  it('clamps pan offset in cover mode', () => {
    const clamped = clampCropState(
      1000,
      500,
      { width: 400, height: 400 },
      { scale: 1, offsetX: 500, offsetY: 500 },
      'cover',
    )
    const rect = computeDrawRect(1000, 500, { width: 400, height: 400 }, clamped, 'cover')
    expect(rect.x).toBeLessThanOrEqual(0)
    expect(rect.x).toBeGreaterThanOrEqual(400 - rect.width)
    expect(rect.y).toBeLessThanOrEqual(0)
    expect(rect.y).toBeGreaterThanOrEqual(400 - rect.height)
  })

  it('resolves editor viewport from aspect ratio', () => {
    const square = resolveEditorViewport(1200, 800, 1)
    expect(square.width).toBe(square.height)
    const wide = resolveEditorViewport(1200, 800, 16 / 9)
    expect(wide.width / wide.height).toBeCloseTo(16 / 9, 1)
  })

  it('scales output size to max dimension', () => {
    const output = resolveOutputSize({ width: 800, height: 400 }, 400)
    expect(Math.max(output.width, output.height)).toBe(400)
  })

  it('exports at source resolution, not editor viewport size', () => {
    // UI viewport ~420px; natural image 4× wider in the draw rect → ~1680px export
    const viewport = { width: 420, height: 120 }
    const sourceScale = resolveSourceScale(2000, 500) // 4
    const output = resolveOutputSize(viewport, 4096, sourceScale)
    expect(output.width).toBe(1680)
    expect(output.height).toBe(480)
  })

  it('caps source-scale export by maxOutputDimension', () => {
    const output = resolveOutputSize({ width: 420, height: 420 }, 1000, 10)
    expect(Math.max(output.width, output.height)).toBe(1000)
  })

  it('detects editable raster mime types', () => {
    expect(shouldOpenImageEditor('image/jpeg')).toBe(true)
    expect(shouldOpenImageEditor('image/png')).toBe(true)
    expect(shouldOpenImageEditor('image/svg+xml')).toBe(false)
  })
})