import { describe, expect, it } from 'vitest'
import {
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
})