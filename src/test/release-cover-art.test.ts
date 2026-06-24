import { describe, expect, it } from 'vitest'
import {
  isItunesSourcedCover,
  isSpotifySourcedCover,
  resolveMergedCoverUpdate,
  shouldImportCoverFromSource,
} from '@/lib/release-cover-art'

describe('release-cover-art', () => {
  it('only allows iTunes as automatic cover source', () => {
    expect(shouldImportCoverFromSource('itunes')).toBe(true)
    expect(shouldImportCoverFromSource('spotify')).toBe(false)
    expect(shouldImportCoverFromSource('discogs')).toBe(false)
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