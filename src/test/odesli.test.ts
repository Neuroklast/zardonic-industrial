import { describe, expect, it } from 'vitest'
import {
  cleanAppleMusicUrl,
  extractStreamingLinksFromOdesli,
  flattenOdesliResult,
} from '@/lib/odesli'
import { buildOdesliLookupUrl } from '@/lib/release-streaming-enrichment'
import { formatStreamingPlatformLabel, getVisibleStreamingLinks } from '@/lib/streaming-platforms'

describe('odesli helpers', () => {
  it('cleans Apple Music geo and query params', () => {
    expect(cleanAppleMusicUrl('https://geo.music.apple.com/us/album/id123?uo=4')).toBe(
      'https://music.apple.com/us/album/id123',
    )
  })

  it('extracts all platform links from an Odesli response', () => {
    const result = extractStreamingLinksFromOdesli({
      linksByPlatform: {
        spotify: { url: 'https://open.spotify.com/album/abc' },
        youtube: { url: 'https://music.youtube.com/watch?v=1' },
        amazon: { url: 'https://music.amazon.com/albums/B123' },
      },
    })

    expect(result.links).toEqual([
      { platform: 'spotify', url: 'https://open.spotify.com/album/abc' },
      { platform: 'youtube', url: 'https://music.youtube.com/watch?v=1' },
      { platform: 'amazonMusic', url: 'https://music.amazon.com/albums/B123' },
    ])
    expect(flattenOdesliResult(result).amazonMusic).toBe('https://music.amazon.com/albums/B123')
  })

  it('builds lookup URLs from stored ids', () => {
    expect(
      buildOdesliLookupUrl({
        spotify_id: '6TElDMiCO7UEj3G0S2B8X0',
        itunes_id: null,
        streaming_links: [],
      }),
    ).toBe('https://open.spotify.com/album/6TElDMiCO7UEj3G0S2B8X0')
  })

  it('builds lookup URLs from display-name platform labels in streaming_links', () => {
    expect(
      buildOdesliLookupUrl({
        streaming_links: [{ platform: 'Spotify', url: 'https://open.spotify.com/album/abc123' }],
      }),
    ).toBe('https://open.spotify.com/album/abc123')
    expect(
      buildOdesliLookupUrl({
        streaming_links: [{ platform: 'Apple Music', url: 'https://music.apple.com/album/id999' }],
      }),
    ).toBe('https://music.apple.com/album/id999')
  })
})

describe('streaming platform labels', () => {
  it('formats known and unknown platform keys', () => {
    expect(formatStreamingPlatformLabel('spotify')).toBe('Spotify')
    expect(formatStreamingPlatformLabel('youtubeMusic')).toBe('YouTube Music')
    expect(formatStreamingPlatformLabel('newPlatform')).toBe('New Platform')
  })

  it('sorts and filters visible streaming links', () => {
    const links = getVisibleStreamingLinks([
      { platform: 'deezer', url: 'https://deezer.com/a' },
      { platform: 'spotify', url: 'https://open.spotify.com/album/a' },
      { platform: 'empty', url: '   ' },
    ])

    expect(links.map((l) => l.platform)).toEqual(['spotify', 'deezer'])
  })
})