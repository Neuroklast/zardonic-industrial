import { describe, expect, it } from 'vitest'
import { getOverlaySessionKey } from '@/lib/overlay-session'
import type { Release } from '@/lib/app-types'

const mockRelease: Release = {
  id: 'rel-42',
  title: 'Test Album',
  artwork: '',
  year: '2024',
  streamingLinks: [],
  type: 'album',
}

describe('getOverlaySessionKey', () => {
  it('returns null when overlay is null', () => {
    expect(getOverlaySessionKey(null)).toBeNull()
  })

  it('returns release-scoped key with id', () => {
    expect(getOverlaySessionKey({ type: 'release', data: mockRelease })).toBe('release:rel-42')
  })

  it('returns release:unknown when release id is missing', () => {
    expect(
      getOverlaySessionKey({
        type: 'release',
        data: { ...mockRelease, id: '' },
      }),
    ).toBe('release:unknown')
  })

  it('returns gig-scoped key', () => {
    expect(
      getOverlaySessionKey({
        type: 'gig',
        data: { id: 'gig-1', date: '2024-01-01', venue: 'Club', location: 'Berlin, DE' },
      }),
    ).toBe('gig:gig-1')
  })

  it('returns member-scoped key', () => {
    expect(
      getOverlaySessionKey({
        type: 'member',
        data: { id: 'mem-1', name: 'Artist', role: 'Vocals', bio: 'Bio' },
      }),
    ).toBe('member:mem-1')
  })

  it('returns overlay type for static overlays', () => {
    expect(getOverlaySessionKey({ type: 'contact' })).toBe('contact')
    expect(getOverlaySessionKey({ type: 'contact' })).toBe('contact')
  })

  it('produces stable keys for same release regardless of object identity', () => {
    const keyA = getOverlaySessionKey({ type: 'release', data: { ...mockRelease } })
    const keyB = getOverlaySessionKey({ type: 'release', data: { ...mockRelease, title: 'Different title' } })
    expect(keyA).toBe(keyB)
  })
})