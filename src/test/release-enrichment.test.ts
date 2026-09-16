import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  releaseNeedsEnrichment,
  releaseNeedsTrackEnrichment,
  releaseTracksAreEmpty,
  runStreamingEnrichmentBatch,
  type ReleaseEnrichmentRow,
} from '@/lib/release-enrichment'

function row(overrides: Partial<ReleaseEnrichmentRow> = {}): ReleaseEnrichmentRow {
  return {
    id: '1',
    title: 'Test',
    tracks: [],
    manually_edited: false,
    spotify_id: 'abc123',
    discogs_id: null,
    itunes_id: null,
    tracks_source: null,
    last_enriched_at: null,
    ...overrides,
  }
}

describe('release-enrichment', () => {
  it('detects empty tracklists', () => {
    expect(releaseTracksAreEmpty([])).toBe(true)
    expect(releaseTracksAreEmpty(null)).toBe(true)
    expect(releaseTracksAreEmpty([{ title: 'A' }])).toBe(false)
  })

  it('skips manually edited releases', () => {
    expect(releaseNeedsTrackEnrichment(row({ manually_edited: true }))).toBe(false)
  })

  it('enriches when tracks are empty and an external id exists', () => {
    expect(releaseNeedsTrackEnrichment(row())).toBe(true)
  })

  it('skips when no external id is available', () => {
    expect(releaseNeedsTrackEnrichment(row({ spotify_id: null }))).toBe(false)
  })

  it('force mode bypasses filled tracklists', () => {
    const filled = row({
      tracks: [{ title: 'Track 1' }],
      last_enriched_at: new Date().toISOString(),
    })
    expect(releaseNeedsTrackEnrichment(filled)).toBe(false)
    expect(releaseNeedsTrackEnrichment(filled, { force: true })).toBe(true)
  })

  it('needs streaming enrichment when few platform links are stored', () => {
    const sparseLinks = row({
      tracks: [{ title: 'Track 1' }],
      last_enriched_at: new Date().toISOString(),
      streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/abc' }],
    })
    expect(releaseNeedsEnrichment(sparseLinks)).toBe(true)
  })

  it('skips streaming enrichment when enough platforms are already stored', () => {
    const richLinks = row({
      tracks: [{ title: 'Track 1' }],
      last_enriched_at: new Date().toISOString(),
      streaming_links: [
        { platform: 'spotify', url: 'https://open.spotify.com/album/a' },
        { platform: 'appleMusic', url: 'https://music.apple.com/album/id1' },
        { platform: 'youtube', url: 'https://music.youtube.com/watch?v=1' },
      ],
    })
    expect(releaseNeedsEnrichment(richLinks)).toBe(false)
  })
})

const ODESLI_RESPONSE = {
  entityUniqueId: '',
  entitiesByUniqueId: {},
  linksByPlatform: {
    spotify: { url: 'https://open.spotify.com/album/abc' },
    deezer: { url: 'https://www.deezer.com/album/1' },
  },
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

describe('runStreamingEnrichmentBatch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('enriches only releases that still need streaming links', async () => {
    const sparse = row({ id: '1', streaming_links: [] })
    const rich = row({
      id: '2',
      last_enriched_at: new Date().toISOString(),
      streaming_links: [
        { platform: 'spotify', url: 'https://open.spotify.com/album/a' },
        { platform: 'appleMusic', url: 'https://music.apple.com/album/id1' },
        { platform: 'youtube', url: 'https://music.youtube.com/watch?v=1' },
      ],
    })
    const { client, updateCalls } = fakeSupabase([sparse, rich])
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(ODESLI_RESPONSE), { status: 200 })))

    const result = await runStreamingEnrichmentBatch(
      client as unknown as Parameters<typeof runStreamingEnrichmentBatch>[0],
    )

    expect(result).toMatchObject({ enriched: 1, total: 2, nextCursor: 2, done: true })
    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0].streaming_links).toEqual(
      expect.arrayContaining([{ platform: 'deezer', url: 'https://www.deezer.com/album/1' }]),
    )
  })

  it('advances the cursor monotonically across bounded batches', async () => {
    const rows = [row({ id: '1' }), row({ id: '2' }), row({ id: '3' })]
    const { client } = fakeSupabase(rows)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(ODESLI_RESPONSE), { status: 200 })))

    const result = await runStreamingEnrichmentBatch(
      client as unknown as Parameters<typeof runStreamingEnrichmentBatch>[0],
      { cursor: 1, limit: 1 },
    )

    expect(result).toMatchObject({ total: 3, nextCursor: 2, done: false })
  })
})
