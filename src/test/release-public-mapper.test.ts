import { describe, expect, it } from 'vitest'
import { mapReleaseRowToOverlayRelease, parseReleaseTracks } from '@/lib/release-public-mapper'

describe('parseReleaseTracks', () => {
  it('parses track rows with artist and duration', () => {
    const tracks = parseReleaseTracks([
      { title: 'Kernel Breaker', artist: 'Zardonic & Guest', duration: '4:12' },
      { title: 'Intro', artist: 'Zardonic' },
    ])
    expect(tracks).toHaveLength(2)
    expect(tracks[0].artist).toBe('Zardonic & Guest')
    expect(tracks[0].duration).toBe('4:12')
  })
})

describe('mapReleaseRowToOverlayRelease', () => {
  it('maps tracks and artists into overlay release data', () => {
    const overlay = mapReleaseRowToOverlayRelease(
      {
        id: 'r1',
        title: 'Antihero',
        type: 'album',
        release_date: '2023-03-15',
        description: 'Album notes',
        cover_storage_path: null,
        cover_url: 'https://example.com/cover.jpg',
        streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/x' }],
        artists: ['Zardonic', 'Guest'],
        tracks: [
          { title: 'Track 1', artist: 'Zardonic', duration: '3:00' },
          { title: 'Track 2', artist: 'Zardonic & Guest', duration: '4:00' },
        ],
        custom_links: [{ label: 'Buy', url: 'https://example.com/buy' }],
        manually_edited: true,
      },
      'https://example.com/cover.jpg',
    )

    expect(overlay.tracks).toHaveLength(2)
    expect(overlay.artists).toEqual(['Zardonic', 'Guest'])
    expect(overlay.customLinks?.[0].label).toBe('Buy')
    expect(overlay.streamingLinks?.[0].platform).toBe('spotify')
  })
})