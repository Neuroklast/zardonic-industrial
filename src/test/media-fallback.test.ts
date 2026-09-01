import { describe, it, expect } from 'vitest'
import { isR2Url, objectPathFromUrl } from '@/lib/media-fallback'

describe('isR2Url', () => {
  it('accepts r2.dev and r2.cloudflarestorage.com hosts', () => {
    expect(isR2Url('https://pub-abc.r2.dev/background/x.webp')).toBe(true)
    expect(isR2Url('https://pub-abc.r2.dev/x.webp')).toBe(true)
    expect(isR2Url('https://abc.r2.cloudflarestorage.com/zardonic-media/x.webp')).toBe(true)
  })

  it('rejects unrelated hosts and junk', () => {
    expect(isR2Url('https://i.scdn.co/image/deadbeef')).toBe(false)
    expect(isR2Url('not a url')).toBe(false)
    expect(isR2Url('')).toBe(false)
  })

  it('recognizes a wsrv-wrapped R2 object for self-heal', () => {
    expect(isR2Url('https://wsrv.nl/?url=https%3A%2F%2Fpub-abc.r2.dev%2Fx.webp')).toBe(true)
  })
})

describe('objectPathFromUrl', () => {
  it('derives the object path from an r2.dev URL', () => {
    expect(objectPathFromUrl('https://pub-abc.r2.dev/background/images/x.webp')).toBe(
      'background/images/x.webp',
    )
  })

  it('strips the bucket prefix on the storage endpoint', () => {
    expect(
      objectPathFromUrl('https://abc.r2.cloudflarestorage.com/zardonic-media/background/x.webp'),
    ).toBe('background/x.webp')
  })

  it('returns null when there is no object segment', () => {
    expect(objectPathFromUrl('https://abc.r2.cloudflarestorage.com/zardonic-media')).toBeNull()
  })
})
