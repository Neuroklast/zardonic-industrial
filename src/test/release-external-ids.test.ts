import { describe, expect, it } from 'vitest'
import {
  normalizeDiscogsArtistId,
  normalizeDiscogsId,
  normalizeItunesArtistId,
  normalizeItunesId,
  normalizeSpotifyArtistId,
  normalizeSpotifyId,
} from '@/lib/release-external-ids'
import { parseCatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import { mergeStreamingLinks } from '@/lib/release-metadata'

describe('release external id normalization', () => {
  it('normalizes iTunes numeric and URL ids', () => {
    expect(normalizeItunesId('1441234567')).toBe('1441234567')
    expect(normalizeItunesId('https://music.apple.com/us/album/example/id1441234567')).toBe('1441234567')
  })

  it('normalizes Spotify ids and URLs', () => {
    expect(normalizeSpotifyId('6TElDMiCO7UEj3G0S2B8X0')).toBe('6TElDMiCO7UEj3G0S2B8X0')
    expect(normalizeSpotifyId('https://open.spotify.com/album/6TElDMiCO7UEj3G0S2B8X0')).toBe('6TElDMiCO7UEj3G0S2B8X0')
    expect(normalizeSpotifyId('spotify:track:6TElDMiCO7UEj3G0S2B8X0')).toBe('6TElDMiCO7UEj3G0S2B8X0')
  })

  it('normalizes Discogs ids and URLs', () => {
    expect(normalizeDiscogsId('12345')).toBe('12345')
    expect(normalizeDiscogsId('https://www.discogs.com/release/12345-Example')).toBe('12345')
    expect(normalizeDiscogsId('https://www.discogs.com/master/98765-Example')).toBe('98765')
  })

  it('normalizes platform artist ids from URLs', () => {
    expect(normalizeSpotifyArtistId('7BqEidErPMNiUXCRE0dV2n')).toBe('7BqEidErPMNiUXCRE0dV2n')
    expect(normalizeSpotifyArtistId('https://open.spotify.com/artist/7BqEidErPMNiUXCRE0dV2n')).toBe(
      '7BqEidErPMNiUXCRE0dV2n',
    )
    expect(normalizeDiscogsArtistId('https://www.discogs.com/artist/261118-Zardonic')).toBe('261118')
    expect(normalizeItunesArtistId('https://music.apple.com/us/artist/zardonic/261118434')).toBe('261118434')
  })
})

describe('parseCatalogueSyncConfig', () => {
  it('normalizes stored artist ids and keeps fallback name', () => {
    const parsed = parseCatalogueSyncConfig({
      artistName: 'Zardonic',
      spotifyArtistId: 'https://open.spotify.com/artist/7BqEidErPMNiUXCRE0dV2n',
      discogsArtistId: '',
      itunesArtistId: '261118434',
    })
    expect(parsed.artistName).toBe('Zardonic')
    expect(parsed.spotifyArtistId).toBe('7BqEidErPMNiUXCRE0dV2n')
    expect(parsed.itunesArtistId).toBe('261118434')
  })
})

describe('mergeStreamingLinks', () => {
  it('upserts by platform without dropping other links', () => {
    const merged = mergeStreamingLinks(
      [{ platform: 'spotify', url: 'https://open.spotify.com/album/old' }],
      [
        { platform: 'spotify', url: 'https://open.spotify.com/album/new' },
        { platform: 'discogs', url: 'https://www.discogs.com/release/1' },
      ],
    )
    expect(merged).toHaveLength(2)
    expect(merged.find((l) => l.platform === 'spotify')?.url).toContain('/album/new')
  })
})