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

  // Apple reports collectionType "Album" for every collection, so singles and
  // EPs must be recovered from the title suffix / track count.
  it('classifies an Apple single from its suffix and track count', () => {
    const result = parseItunesItem({
      wrapperType: 'collection',
      collectionType: 'Album',
      collectionName: 'Bitter (feat. Reebz) - Single',
      collectionId: 1667056494,
      trackCount: 1,
    })
    expect(result?.type).toBe('single')
  })

  it('accepts EP collections (previously dropped)', () => {
    const result = parseItunesItem({
      wrapperType: 'collection',
      collectionType: 'Album',
      collectionName: 'Phoenix Down - EP',
      collectionId: 510385000,
      trackCount: 5,
    })
    expect(result?.type).toBe('ep')
  })

  it('classifies compilation collections', () => {
    const result = parseItunesItem({
      wrapperType: 'collection',
      collectionType: 'Album',
      collectionName: 'Best Of Zardonic',
      collectionId: 42,
      trackCount: 20,
    })
    expect(result?.type).toBe('compilation')
  })

  it('prefers the remix title marker over the Single suffix', () => {
    const result = parseItunesItem({
      wrapperType: 'collection',
      collectionType: 'Album',
      collectionName: 'Higher (Zardonic Remix) - Single',
      collectionId: 1507304519,
      trackCount: 1,
    })
    expect(result?.type).toBe('remix')
  })

  it('classifies song tracks from their parent collection name', () => {
    const result = parseItunesItem({
      wrapperType: 'track',
      kind: 'song',
      trackName: 'Bring It On (feat. Mikey Rukus)',
      collectionName: 'Bring It On (feat. Mikey Rukus) - Single',
      collectionId: 1016964876,
      trackId: 1016964892,
      trackCount: 1,
    })
    expect(result?.type).toBe('single')
    expect(result?.title).toBe('Bring It On (feat. Mikey Rukus) - Single')
    expect(result?.itunes_id).toBe('1016964876')
  })
})
