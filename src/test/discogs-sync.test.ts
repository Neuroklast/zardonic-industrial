import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchDiscogsArtistReleases,
  fetchDiscogsArtistReleasesPage,
} from '@/lib/discogs-sync'

const ORIGINAL_TOKEN = process.env.DISCOGS_TOKEN

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  process.env.DISCOGS_TOKEN = 'test-token'
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.DISCOGS_TOKEN
  } else {
    process.env.DISCOGS_TOKEN = ORIGINAL_TOKEN
  }
})

describe('fetchDiscogsArtistReleasesPage', () => {
  it('reports total pages from pagination', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          releases: [{ id: 1, title: 'Anthem', year: 2020, type: 'release' }],
          pagination: { pages: 3 },
        }),
      ),
    )

    const result = await fetchDiscogsArtistReleasesPage(99, 1)

    expect(result.ok).toBe(true)
    expect(result.totalPages).toBe(3)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].discogs_id).toBe('1')
  })

  it('keeps paging when pagination is missing but the page is full', async () => {
    const releases = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      title: `Release ${index + 1}`,
      year: 2020,
      type: 'release',
    }))
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ releases })))

    const result = await fetchDiscogsArtistReleasesPage(99, 1)

    expect(result.totalPages).toBe(2)
  })

  it('stops when pagination is missing and the page is short', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ releases: [{ id: 1, title: 'Anthem', year: 2020 }] })),
    )

    const result = await fetchDiscogsArtistReleasesPage(99, 1)

    expect(result.totalPages).toBe(1)
  })

  it('retries a transient 5xx response', async () => {
    let calls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls++
        if (calls === 1) return jsonResponse({}, 503)
        return jsonResponse({
          releases: [{ id: 1, title: 'Anthem', year: 2020, type: 'release' }],
          pagination: { pages: 1 },
        })
      }),
    )

    const result = await fetchDiscogsArtistReleasesPage(99, 1)

    expect(result.ok).toBe(true)
    expect(calls).toBe(2)
  })
})

describe('fetchDiscogsArtistReleases', () => {
  it('throws instead of silently truncating on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 404)))

    await expect(fetchDiscogsArtistReleases(99)).rejects.toThrow(/Discogs/)
  })
})
