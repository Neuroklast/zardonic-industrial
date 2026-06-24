import { describe, expect, it } from 'vitest'
import { resolveGalleryTileAspect } from '@/lib/gallery-aspect-ratio'

describe('resolveGalleryTileAspect', () => {
  it('maps square admin value to aspect-square', () => {
    expect(resolveGalleryTileAspect('square').className).toContain('aspect-square')
  })

  it('maps 16/9 admin value to aspect-video', () => {
    expect(resolveGalleryTileAspect('16/9').className).toContain('aspect-video')
  })

  it('maps auto to a flexible min height', () => {
    expect(resolveGalleryTileAspect('auto').className).toContain('aspect-auto')
  })
})