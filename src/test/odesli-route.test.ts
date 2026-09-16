import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  isAdminSession: vi.fn(),
  consumeRateLimitForRequest: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/api-admin-auth', () => ({ isAdminSession: mocks.isAdminSession }))
vi.mock('@/lib/rate-limit', () => ({
  consumeRateLimitForRequest: mocks.consumeRateLimitForRequest,
}))
vi.mock('@/lib/supabaseAdmin', () => ({ createAdminClient: mocks.createAdminClient }))

import { GET, POST } from '@/app/api/odesli/route'

const ODESLI_RESPONSE = {
  entityUniqueId: 'e1',
  entitiesByUniqueId: { e1: { id: 'e1', type: 'song', thumbnailUrl: 'https://cdn.example/art.jpg' } },
  linksByPlatform: {
    spotify: { url: 'https://open.spotify.com/album/abc' },
    deezer: { url: 'https://www.deezer.com/album/1' },
    amazon: { url: 'https://music.amazon.com/albums/B123' },
  },
}

const RELEASE_ROW = {
  id: 'r1',
  title: 'Test Release',
  tracks: [],
  manually_edited: false,
  spotify_id: '6TElDMiCO7UEj3G0S2B8X0',
  discogs_id: null,
  itunes_id: null,
  tracks_source: null,
  last_enriched_at: null,
  streaming_links: [],
}

function fakeSupabase(rows: unknown[]) {
  const updateCalls: Array<Record<string, unknown>> = []
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: async () => ({ data: rows, error: null }),
          }),
        }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: async () => {
          updateCalls.push(values)
          return { error: null }
        },
      }),
    }),
  }
  return { client, updateCalls }
}

describe('/api/odesli', () => {
  beforeEach(() => {
    mocks.isAdminSession.mockResolvedValue(true)
    mocks.consumeRateLimitForRequest.mockResolvedValue({ namespace: 'odesli', allowed: true })
    const { client } = fakeSupabase([])
    mocks.createAdminClient.mockReturnValue(client)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('GET rejects unauthenticated callers', async () => {
    mocks.isAdminSession.mockResolvedValue(false)
    const res = await GET(new Request('http://local.test/api/odesli?url=https://open.spotify.com/album/abc'))
    expect(res.status).toBe(401)
  })

  it('GET rejects a missing url', async () => {
    const res = await GET(new Request('http://local.test/api/odesli'))
    expect(res.status).toBe(400)
  })

  it('GET rejects a non-URL value', async () => {
    const res = await GET(new Request('http://local.test/api/odesli?url=not-a-url'))
    expect(res.status).toBe(400)
  })

  it('GET returns 429 when rate limited', async () => {
    mocks.consumeRateLimitForRequest.mockResolvedValue({ namespace: 'odesli', allowed: false })
    const res = await GET(new Request('http://local.test/api/odesli?url=https://open.spotify.com/album/abc'))
    expect(res.status).toBe(429)
  })

  it('GET returns normalized links and passes userCountry through', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(ODESLI_RESPONSE), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await GET(
      new Request(
        `http://local.test/api/odesli?url=${encodeURIComponent('https://open.spotify.com/album/abc')}&userCountry=DE`,
      ),
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const body = await res.json()
    expect(body.entityType).toBe('song')
    expect(body.artwork).toBe('https://cdn.example/art.jpg')
    expect(body.links).toEqual([
      { platform: 'spotify', url: 'https://open.spotify.com/album/abc' },
      { platform: 'deezer', url: 'https://www.deezer.com/album/1' },
      { platform: 'amazonMusic', url: 'https://music.amazon.com/albums/B123' },
    ])

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('api.song.link')
    expect(calledUrl).toContain('userCountry=DE')
  })

  it('GET returns an empty link set when the upstream is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })))
    const res = await GET(new Request('http://local.test/api/odesli?url=https://open.spotify.com/album/abc'))
    expect(res.status).toBe(200)
    expect((await res.json()).links).toEqual([])
  })

  it('GET returns 502 when the upstream fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('network down'))))
    const res = await GET(new Request('http://local.test/api/odesli?url=https://open.spotify.com/album/abc'))
    expect(res.status).toBe(502)
  })

  it('POST rejects unauthenticated callers', async () => {
    mocks.isAdminSession.mockResolvedValue(false)
    const res = await POST(new Request('http://local.test/api/odesli', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('POST rejects an out-of-range limit', async () => {
    const res = await POST(
      new Request('http://local.test/api/odesli', {
        method: 'POST',
        body: JSON.stringify({ limit: 100 }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('POST returns 429 when rate limited', async () => {
    mocks.consumeRateLimitForRequest.mockResolvedValue({ namespace: 'odesli', allowed: false })
    const res = await POST(new Request('http://local.test/api/odesli', { method: 'POST' }))
    expect(res.status).toBe(429)
  })

  it('POST merges Odesli links for a release and reports batch progress', async () => {
    const { client, updateCalls } = fakeSupabase([RELEASE_ROW])
    mocks.createAdminClient.mockReturnValue(client)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(ODESLI_RESPONSE), { status: 200 })))

    const res = await POST(
      new Request('http://local.test/api/odesli', { method: 'POST', body: JSON.stringify({ cursor: 0 }) }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ enriched: 1, skipped: 0, nextCursor: 1, total: 1, done: true, remaining: 0 })
    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0].streaming_links).toEqual(
      expect.arrayContaining([
        { platform: 'spotify', url: 'https://open.spotify.com/album/abc' },
        { platform: 'amazonMusic', url: 'https://music.amazon.com/albums/B123' },
      ]),
    )
  })

  it('POST accepts an empty body (defaults)', async () => {
    const res = await POST(new Request('http://local.test/api/odesli', { method: 'POST' }))
    expect(res.status).toBe(200)
  })

  it('POST returns 500 when the batch throws', async () => {
    mocks.createAdminClient.mockImplementation(() => {
      throw new Error('no admin client')
    })
    const res = await POST(new Request('http://local.test/api/odesli', { method: 'POST' }))
    expect(res.status).toBe(500)
  })
})
