import { describe, expect, it } from 'vitest'
import {
  exportFileNameForMime,
  formatImageUploadError,
  preferredExportMime,
} from '@/lib/image-crop-export'

describe('image-crop-export', () => {
  it('prefers webp for alpha and opaque sources', () => {
    expect(preferredExportMime(true).type).toBe('image/webp')
    expect(preferredExportMime(false).type).toBe('image/webp')
    expect(preferredExportMime(true).quality).toBeGreaterThan(0.8)
  })

  it('maps mime to export file name', () => {
    expect(exportFileNameForMime('image/webp')).toBe('edited-image.webp')
    expect(exportFileNameForMime('image/jpeg')).toBe('edited-image.jpg')
    expect(exportFileNameForMime('image/png')).toBe('edited-image.png')
  })

  it('formats body-limit errors for admins', () => {
    const msg = formatImageUploadError(
      new Error('Body exceeded 1 MB limit.\nTo configure the body size limit...'),
    )
    expect(msg).toMatch(/too large/i)
    expect(msg).toMatch(/Body exceeded/i)
  })

  it('formats React #441-style production errors', () => {
    const msg = formatImageUploadError(
      new Error('Minified React error #441; visit https://react.dev/errors/441'),
    )
    expect(msg).toMatch(/size limit/i)
  })

  it('passes through ordinary messages', () => {
    expect(formatImageUploadError(new Error('Missing R2 credentials'))).toBe(
      'Missing R2 credentials',
    )
  })
})
