import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchITunesReleases } from './itunes'

describe('fetchITunesReleases', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch and parse releases from proxy', async () => {
    const mockSongsData = {
      results: [
        {
          collectionId: 1001,
          collectionName: 'Test Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/art100x100bb.jpg',
          releaseDate: '2023-01-15T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/1001',
        },
      ],
    }
    const mockAlbumsData = {
      results: [
        {
          collectionId: 1002,
          collectionName: 'Another Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/art2100x100bb.jpg',
          releaseDate: '2022-06-01T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/1002',
        },
      ],
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSongsData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAlbumsData) })

    const result = await fetchITunesReleases()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('/api/itunes?')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('entity=song')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[1][0]).toContain('entity=album')

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Test Album')
    expect(result[0].id).toBe('itunes-1001')
    expect(result[0].artwork).toContain('600x600bb')
    expect(result[0].releaseDate).toBe('2023-01-15')
    expect(result[0].appleMusic).toBe('https://music.apple.com/album/1001')
  })

  it('should sort releases newest first', async () => {
    const mockData = {
      results: [
        {
          collectionId: 1,
          collectionName: 'Old Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/old100x100bb.jpg',
          releaseDate: '2020-01-01T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/1',
        },
        {
          collectionId: 2,
          collectionName: 'New Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/new100x100bb.jpg',
          releaseDate: '2024-01-01T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/2',
        },
      ],
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) })

    const result = await fetchITunesReleases()
    expect(result[0].title).toBe('New Album')
    expect(result[1].title).toBe('Old Album')
  })

  it('should filter results to only Zardonic releases', async () => {
    const mockData = {
      results: [
        {
          collectionId: 1,
          collectionName: 'Zardonic Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/art100x100bb.jpg',
          releaseDate: '2023-01-01T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/1',
        },
        {
          collectionId: 2,
          collectionName: 'Other Album',
          artistName: 'Some Other Artist',
          artworkUrl100: 'https://example.com/art100x100bb.jpg',
          releaseDate: '2023-01-01T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/2',
        },
      ],
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) })

    const result = await fetchITunesReleases()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Zardonic Album')
  })

  it('should deduplicate releases by collectionId', async () => {
    const mockData = {
      results: [
        {
          collectionId: 1,
          collectionName: 'Same Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/art100x100bb.jpg',
          releaseDate: '2023-01-01T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/1',
        },
        {
          collectionId: 1,
          collectionName: 'Same Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/art100x100bb.jpg',
          releaseDate: '2023-01-01T00:00:00Z',
          collectionViewUrl: 'https://music.apple.com/album/1',
        },
      ],
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) })

    const result = await fetchITunesReleases()
    expect(result).toHaveLength(1)
  })

  it('should return empty array on API failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) })

    const result = await fetchITunesReleases()
    expect(result).toEqual([])
  })

  it('should return empty array on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await fetchITunesReleases()
    expect(result).toEqual([])
  })

  it('should skip entries without collectionId', async () => {
    const mockData = {
      results: [
        {
          collectionName: 'No ID Album',
          artistName: 'Zardonic',
          artworkUrl100: 'https://example.com/art100x100bb.jpg',
        },
      ],
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) })

    const result = await fetchITunesReleases()
    expect(result).toEqual([])
  })
})
