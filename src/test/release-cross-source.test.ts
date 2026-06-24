import { describe, expect, it } from 'vitest'
import {
  externalIdsFromStreamingLinks,
  extractDiscogsIdFromLinks,
  extractItunesAlbumIdFromLinks,
  extractSpotifyAlbumIdFromLinks,
} from '@/lib/release-streaming-enrichment'

describe('cross-source streaming link ids', () => {
  it('extracts Spotify album id from Odesli links', () => {
    const id = extractSpotifyAlbumIdFromLinks([
      { platform: 'spotify', url: 'https://open.spotify.com/album/7BqEidErPMNiUXCRE0dV2n' },
    ])
    expect(id).toBe('7BqEidErPMNiUXCRE0dV2n')
  })

  it('extracts iTunes album id from Apple Music links', () => {
    const id = extractItunesAlbumIdFromLinks([
      { platform: 'appleMusic', url: 'https://music.apple.com/album/id123456789' },
    ])
    expect(id).toBe('123456789')
  })

  it('extracts Discogs release id from links', () => {
    const id = extractDiscogsIdFromLinks([
      { platform: 'discogs', url: 'https://www.discogs.com/release/12345-Zardonic' },
    ])
    expect(id).toBe('12345')
  })

  it('fills missing external ids from Odesli link set', () => {
    const ids = externalIdsFromStreamingLinks(
      [
        { platform: 'spotify', url: 'https://open.spotify.com/album/7BqEidErPMNiUXCRE0dV2n' },
        { platform: 'appleMusic', url: 'https://music.apple.com/album/id999' },
        { platform: 'deezer', url: 'https://deezer.com/album/1' },
      ],
      { discogs_id: '42' },
    )
    expect(ids.spotify_id).toBe('7BqEidErPMNiUXCRE0dV2n')
    expect(ids.itunes_id).toBe('999')
    expect(ids.discogs_id).toBeUndefined()
  })
})