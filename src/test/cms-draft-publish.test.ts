/**
 * Tests for Draft/Publish system.
 * Verifies that public endpoints only return published content and never drafts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// -------------------------------------------------------------------------
// Mock Prisma for public endpoints
// -------------------------------------------------------------------------
const mockReleaseFindMany = vi.fn()
const mockGigFindMany = vi.fn()
const mockVideoFindMany = vi.fn()
const mockNewsPostFindMany = vi.fn()
const mockBiographyFindUnique = vi.fn()
const mockMemberFindMany = vi.fn()

vi.mock('../../api/_prisma.ts', () => ({
  prisma: {
    release: { findMany: mockReleaseFindMany },
    gig: { findMany: mockGigFindMany },
    video: { findMany: mockVideoFindMany },
    newsPost: { findMany: mockNewsPostFindMany },
    biography: { findUnique: mockBiographyFindUnique },
    shellMember: { findMany: mockMemberFindMany },
  },
}))

vi.mock('../../api/_ratelimit.ts', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  hashIp: vi.fn().mockReturnValue('hash123'),
}))

// -------------------------------------------------------------------------
// Import handlers once
// -------------------------------------------------------------------------
const { default: publicReleasesHandler } = await import('../../api/public/releases.ts')
const { default: publicGigsHandler } = await import('../../api/public/gigs.ts')
const { default: publicVideosHandler } = await import('../../api/public/videos.ts')
const { default: publicNewsHandler } = await import('../../api/public/news.ts')
const { default: publicBioHandler } = await import('../../api/public/biography.ts')
const { default: publicMembersHandler } = await import('../../api/public/members.ts')

// -------------------------------------------------------------------------
type MockRes = { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; setHeader: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn>; _status: number; _json: unknown }
function mockRes(): MockRes {
  const res: MockRes = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn(), end: vi.fn(), _status: 200, _json: null }
  res.status.mockImplementation((s: number) => { res._status = s; return res })
  res.json.mockImplementation((j: unknown) => { res._json = j; return res })
  res.setHeader.mockReturnValue(res)
  res.end.mockReturnValue(res)
  return res
}

beforeEach(() => vi.clearAllMocks())

// -------------------------------------------------------------------------
// Public Releases
// -------------------------------------------------------------------------

describe('Public Releases — only published content', () => {
  it('queries with isDraft: false filter', async () => {
    mockReleaseFindMany.mockResolvedValue([])
    const res = mockRes()
    await publicReleasesHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(res._status).toBe(200)
    expect(mockReleaseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isDraft: false }) })
    )
  })

  it('returns 405 for non-GET', async () => {
    const res = mockRes()
    await publicReleasesHandler({ method: 'POST', headers: {}, query: {} } as never, res as never)
    expect(res._status).toBe(405)
  })
})

// -------------------------------------------------------------------------
// Public Gigs
// -------------------------------------------------------------------------

describe('Public Gigs — only published content', () => {
  it('queries with isDraft: false filter', async () => {
    mockGigFindMany.mockResolvedValue([])
    const res = mockRes()
    await publicGigsHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(mockGigFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isDraft: false }) })
    )
  })
})

// -------------------------------------------------------------------------
// Public Videos
// -------------------------------------------------------------------------

describe('Public Videos — only published content', () => {
  it('queries with isDraft: false filter', async () => {
    mockVideoFindMany.mockResolvedValue([])
    const res = mockRes()
    await publicVideosHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(mockVideoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isDraft: false }) })
    )
  })
})

// -------------------------------------------------------------------------
// Public Biography
// -------------------------------------------------------------------------

describe('Public Biography — only published content', () => {
  it('returns 404 if biography isDraft: true', async () => {
    mockBiographyFindUnique.mockResolvedValue({ id: 'main', content: 'Draft', isDraft: true })
    const res = mockRes()
    await publicBioHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(res._status).toBe(404)
  })

  it('returns published content when isDraft: false', async () => {
    mockBiographyFindUnique.mockResolvedValue({
      id: 'main', content: 'Draft content', isDraft: false,
      publishedContent: 'Published content', shortBio: 'Short', pressKitUrl: null, photoUrls: [], publishedAt: new Date(),
    })
    const res = mockRes()
    await publicBioHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(res._status).toBe(200)
    expect((res._json as { content: string }).content).toBe('Published content')
  })

  it('falls back to content if publishedContent is null', async () => {
    mockBiographyFindUnique.mockResolvedValue({
      id: 'main', content: 'Only content', isDraft: false,
      publishedContent: null, shortBio: null, pressKitUrl: null, photoUrls: [], publishedAt: new Date(),
    })
    const res = mockRes()
    await publicBioHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect((res._json as { content: string }).content).toBe('Only content')
  })
})

// -------------------------------------------------------------------------
// Public News
// -------------------------------------------------------------------------

describe('Public News — only published content', () => {
  it('queries with isDraft: false filter', async () => {
    mockNewsPostFindMany.mockResolvedValue([])
    const res = mockRes()
    await publicNewsHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(mockNewsPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isDraft: false }) })
    )
  })
})

// -------------------------------------------------------------------------
// Public Members
// -------------------------------------------------------------------------

describe('Public Members — only active', () => {
  it('queries with isActive: true filter', async () => {
    mockMemberFindMany.mockResolvedValue([])
    const res = mockRes()
    await publicMembersHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(mockMemberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    )
  })
})
