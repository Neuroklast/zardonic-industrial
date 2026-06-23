import { describe, expect, it } from 'vitest'
import { parseItunesItem } from '@/lib/itunes-sync'

describe('parseItunesItem', () => {
  it('parses album collections', () => {
    const result = parseItunesItem({
      wrapperType: 'collection',
      collectionType: 'Album',
      collectionName: 'Test Album',
      collectionId: 123,
      artworkUrl100: 'https://example.com/100x100bb.jpg',
    })
    expect(result?.title).toBe('Test Album')
    expect(result?.type).toBe('album')
    expect(result?.itunes_id).toBe('123')
  })

  it('parses song tracks', () => {
    const result = parseItunesItem({
      wrapperType: 'track',
      kind: 'song',
      trackName: 'Test Single',
      trackId: 456,
      artworkUrl100: 'https://example.com/100x100bb.jpg',
    })
    expect(result?.title).toBe('Test Single')
    expect(result?.itunes_id).toBe('456')
  })

  it('rejects unrelated track kinds', () => {
    const result = parseItunesItem({
      wrapperType: 'track',
      kind: 'podcast',
      trackName: 'Podcast',
      trackId: 789,
    })
    expect(result).toBeNull()
  })
})