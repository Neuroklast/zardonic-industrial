/**
 * Unit tests for iTunes sync utilities in app/admin/_actions/itunesSync.ts
 *
 * We test parseItunesItem (exposed for testing via re-export) indirectly
 * by testing syncReleasesFromItunes with mocked fetch + Supabase + R2.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase admin client ──────────────────────────────────────────────
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabaseAdmin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}))

vi.mock('@/app/admin/_actions/auth', () => ({
  runAdminAction: async <T extends object>(action: () => Promise<T>) => action(),
}))

// ── Mock R2 upload ──────────────────────────────────────────────────────────
vi.mock('@/app/admin/_actions/r2Upload', () => ({
  uploadBufferToR2: vi.fn().mockResolvedValue({
    publicUrl: 'https://r2.example.com/releases/itunes-123.jpg',
    objectPath: 'releases/itunes-123.jpg',
  }),
}))

// ── Mock revalidatePath ─────────────────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeItunesAlbum(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    wrapperType: 'collection',
    collectionType: 'Album',
    collectionId: 123456,
    collectionName: 'Test Album',
    artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music/abc/100x100bb.jpg',
    releaseDate: '2023-06-15T07:00:00Z',
    ...overrides,
  }
}

function makeItunesSingle(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    wrapperType: 'collection',
    collectionType: 'Single',
    collectionId: 789012,
    collectionName: 'Test Single',
    artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music/def/100x100bb.jpg',
    releaseDate: '2023-11-01T07:00:00Z',
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('syncReleasesFromItunes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: empty existing IDs + display_order 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'releases') {
        return {
          select: mockSelect,
          insert: mockInsert,
        }
      }
      return { select: mockSelect, insert: mockInsert }
    })

    // Chain: .select().not() -> existing IDs
    mockSelect.mockImplementation(() => ({
      not: vi.fn().mockResolvedValue({ data: [] }),
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }))
  })

  it('returns error when artist name is empty', async () => {
    const { syncReleasesFromItunes } = await import('@/app/admin/_actions/itunesSync')
    const result = await syncReleasesFromItunes('')
    expect(result.errors).toContain('Artist name is required')
    expect(result.synced).toBe(0)
  })

  it('syncs albums and singles from iTunes, skipping existing', async () => {
    const albumData = { results: [makeItunesAlbum(), makeItunesSingle()] }
    const singleData = { results: [] }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => albumData })
      .mockResolvedValueOnce({ ok: true, json: async () => singleData })

    // Existing IDs contains the Single ID
    const existingId = String((makeItunesSingle() as { collectionId: number }).collectionId)
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        not: vi.fn().mockResolvedValue({ data: [{ itunes_id: existingId }] }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { display_order: 0 } }),
          }),
        }),
      })),
      insert: mockInsert,
    }))

    const { syncReleasesFromItunes } = await import('@/app/admin/_actions/itunesSync')
    const result = await syncReleasesFromItunes('TestArtist')

    expect(result.synced).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.errors).toHaveLength(0)
    expect(mockInsert).toHaveBeenCalledOnce()
  })

  it('handles iTunes API failure gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    const { syncReleasesFromItunes } = await import('@/app/admin/_actions/itunesSync')
    const result = await syncReleasesFromItunes('SomeArtist')

    // Both requests fail → error reported but no crash
    expect(result.synced).toBe(0)
    expect(result.errors.length).toBeGreaterThanOrEqual(1)
  })

  it('inserts album with correct type classification', async () => {
    const epItem = makeItunesAlbum({ collectionName: 'Some Tracks EP', collectionId: 111 })
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [epItem] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) })

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        not: vi.fn().mockResolvedValue({ data: [] }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      })),
      insert: mockInsert,
    }))

    const { syncReleasesFromItunes } = await import('@/app/admin/_actions/itunesSync')
    await syncReleasesFromItunes('TestArtist')

    const insertCall = mockInsert.mock.calls[0][0] as Record<string, unknown>
    expect(insertCall.type).toBe('ep')
    expect(insertCall.title).toBe('Some Tracks EP')
    expect(insertCall.itunes_id).toBe('111')
  })

  it('continues when artwork upload fails (non-fatal)', async () => {
    const { uploadBufferToR2 } = await import('@/app/admin/_actions/r2Upload')
    vi.mocked(uploadBufferToR2).mockRejectedValueOnce(new Error('R2 connection error'))

    // Provide a valid artwork URL so upload is attempted
    process.env.R2_ACCOUNT_ID = 'test-account'

    const albumData = { results: [makeItunesAlbum()] }
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => albumData })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        not: vi.fn().mockResolvedValue({ data: [] }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      })),
      insert: mockInsert,
    }))

    const { syncReleasesFromItunes } = await import('@/app/admin/_actions/itunesSync')
    const result = await syncReleasesFromItunes('TestArtist')

    // Should still sync despite artwork failure
    expect(result.synced).toBe(1)
    expect(result.errors.some((e) => e.includes('Artwork upload failed'))).toBe(true)

    delete process.env.R2_ACCOUNT_ID
  })
})
