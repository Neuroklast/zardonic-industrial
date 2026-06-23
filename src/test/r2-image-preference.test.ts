import { describe, expect, it } from 'vitest'
import { preferR2StoragePath } from '@/lib/r2-image-preference'

describe('preferR2StoragePath', () => {
  it('clears external URL when storage path is set', () => {
    const result = preferR2StoragePath(
      { image_storage_path: 'gallery/1.jpg', image_url: 'https://example.com/a.png' },
      'image_storage_path',
      'image_url',
    )
    expect(result.image_storage_path).toBe('gallery/1.jpg')
    expect(result.image_url).toBeNull()
  })

  it('keeps external URL when no storage path', () => {
    const result = preferR2StoragePath(
      { image_storage_path: null, image_url: 'https://example.com/a.png' },
      'image_storage_path',
      'image_url',
    )
    expect(result.image_url).toBe('https://example.com/a.png')
  })
})