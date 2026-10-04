import { describe, expect, it } from 'vitest'
import {
  coverSourcePriority,
  isItunesSourcedCover,
  isSpotifySourcedCover,
  resolveMergedCoverUpdate,
  shouldImportCoverFromSource,
  shouldReplaceCoverWithSource,
} from '@/lib/release-cover-art'

describe('release-cover-art', () => {
  it('allows iTunes, Spotify and Discogs as automatic cover sources', () => {
    expect(shouldImportCoverFromSource('itunes')).toBe(true)
    expect(shouldImportCoverFromSource('spotify')).toBe(true)
    expect(shouldImportCoverFromSource('discogs')).toBe(true)
  })

  it('detects iTunes and Spotify cover origins', () => {
    expect(
      isItunesSourcedCover({
        cover_storage_path: 'releases/itunes-123.jpg',
        cover_url: null,
      }),
    ).toBe(true)
    expect(
      isSpotifySourcedCover({
        cover_storage_path: 'releases/spotify-abc.jpg',
        cover_url: 'https://i.scdn.co/image/deadbeef',
      }),
    ).toBe(true)
  })

  it('prefers iTunes cover over Spotify when consolidating', () => {
    const result = resolveMergedCoverUpdate(
      {
        cover_storage_path: 'releases/spotify-aaa',
        cover_url: 'https://i.scdn.co/image/aaa',
      },
      {
        cover_storage_path: 'releases/itunes-bbb',
        cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/bbb.jpg',
      },
    )

    expect(result.update).toEqual({
      cover_storage_path: 'releases/itunes-bbb',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/bbb.jpg',
    })
    expect(result.discardPaths).toContain('releases/spotify-aaa')
    expect(result.discardPaths).not.toContain('releases/itunes-bbb')
  })

  it('ranks cover sources iTunes > Spotify > Discogs', () => {
    expect(coverSourcePriority('itunes')).toBeGreaterThan(coverSourcePriority('spotify'))
    expect(coverSourcePriority('spotify')).toBeGreaterThan(coverSourcePriority('discogs'))
  })

  it('accepts a source cover for a coverless row', () => {
    expect(shouldReplaceCoverWithSource({}, 'discogs')).toBe(true)
  })

  it('replaces a lower-priority cover with a higher-priority source', () => {
    const spotify = {
      cover_storage_path: 'releases/spotify-abc.jpg',
      cover_url: 'https://i.scdn.co/image/abc',
    }
    expect(shouldReplaceCoverWithSource(spotify, 'itunes')).toBe(true)
  })

  it('keeps a higher-priority cover and does not re-download the same source', () => {
    const itunes = {
      cover_storage_path: 'releases/itunes-123.jpg',
      cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/x.jpg',
    }
    expect(shouldReplaceCoverWithSource(itunes, 'spotify')).toBe(false)
    expect(shouldReplaceCoverWithSource(itunes, 'discogs')).toBe(false)
    // Same source: already the best cover — never re-fetch on every sync.
    expect(shouldReplaceCoverWithSource(itunes, 'itunes')).toBe(false)
  })

  it('migrates an external-URL-only cover onto R2 regardless of source rank', () => {
    const externalOnly = { cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/x.jpg' }
    expect(shouldReplaceCoverWithSource(externalOnly, 'itunes')).toBe(true)
    expect(shouldReplaceCoverWithSource(externalOnly, 'spotify')).toBe(true)
  })

  it('discards Spotify duplicate cover without adopting it', () => {
    const result = resolveMergedCoverUpdate(
      {
        cover_storage_path: 'releases/itunes-keep',
        cover_url: 'https://is1-ssl.mzstatic.com/keep.jpg',
      },
      {
        cover_storage_path: 'releases/spotify-drop',
        cover_url: 'https://i.scdn.co/image/drop',
      },
    )

    expect(result.update).toBeNull()
    expect(result.discardPaths).toEqual(['releases/spotify-drop'])
  })
})