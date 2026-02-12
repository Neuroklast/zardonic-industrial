import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchOdesliLinks } from './odesli'

describe('fetchOdesliLinks', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch and parse streaming links from proxy', async () => {
    const mockResponse = {
      linksByPlatform: {
        spotify: { url: 'https://open.spotify.com/track/123', entityUniqueId: 's1' },
        appleMusic: { url: 'https://music.apple.com/track/123', entityUniqueId: 'a1' },
        soundcloud: { url: 'https://soundcloud.com/track/123', entityUniqueId: 'sc1' },
        youtube: { url: 'https://youtube.com/watch?v=123', entityUniqueId: 'y1' },
        bandcamp: { url: 'https://artist.bandcamp.com/track/123', entityUniqueId: 'b1' },
      },
      entitiesByUniqueId: {},
      entityUniqueId: 'e1',
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await fetchOdesliLinks('https://music.apple.com/track/123')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/odesli?')
    )
    expect(result).toEqual({
      spotify: 'https://open.spotify.com/track/123',
      appleMusic: 'https://music.apple.com/track/123',
      soundcloud: 'https://soundcloud.com/track/123',
      youtube: 'https://youtube.com/watch?v=123',
      bandcamp: 'https://artist.bandcamp.com/track/123',
    })
  })

  it('should return null when the API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const result = await fetchOdesliLinks('https://music.apple.com/track/123')
    expect(result).toBeNull()
  })

  it('should return null when fetch throws an error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await fetchOdesliLinks('https://music.apple.com/track/123')
    expect(result).toBeNull()
  })

  it('should handle partial platform links', async () => {
    const mockResponse = {
      linksByPlatform: {
        spotify: { url: 'https://open.spotify.com/track/123', entityUniqueId: 's1' },
      },
      entitiesByUniqueId: {},
      entityUniqueId: 'e1',
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await fetchOdesliLinks('https://music.apple.com/track/123')
    expect(result).toEqual({
      spotify: 'https://open.spotify.com/track/123',
    })
  })

  it('should encode the streaming URL in the request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ linksByPlatform: {}, entitiesByUniqueId: {}, entityUniqueId: '' }),
    })

    await fetchOdesliLinks('https://music.apple.com/us/album/test?uo=4')

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain(encodeURIComponent('https://music.apple.com/us/album/test?uo=4'))
    expect(calledUrl).toContain('userCountry=DE')
  })
})
