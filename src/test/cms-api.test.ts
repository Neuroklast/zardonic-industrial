/**
 * Tests for CMS API endpoints — site-config, releases, gigs, videos.
 * All database and auth calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// -------------------------------------------------------------------------
// Mock Prisma — must be hoisted before any imports that use it
// -------------------------------------------------------------------------
const mockSiteConfigUpsert = vi.fn()
const mockSiteConfigFindUnique = vi.fn()
const mockReleaseCreate = vi.fn()
const mockReleaseFindMany = vi.fn()
const mockReleaseFindUnique = vi.fn()
const mockReleaseUpdate = vi.fn()
const mockReleaseDelete = vi.fn()
const mockGigCreate = vi.fn()
const mockGigFindMany = vi.fn()
const mockGigDelete = vi.fn()
const mockVideoFindMany = vi.fn()
const mockVideoDelete = vi.fn()
const mockActivityCreate = vi.fn()

// Mock @upstash/redis — must be declared before handler imports
vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = vi.fn().mockResolvedValue(null)
    set = vi.fn().mockResolvedValue('OK')
    del = vi.fn().mockResolvedValue(1)
    scan = vi.fn().mockResolvedValue([0, []])
    incr = vi.fn().mockResolvedValue(1)
    expire = vi.fn().mockResolvedValue(1)
    sadd = vi.fn().mockResolvedValue(1)
    smembers = vi.fn().mockResolvedValue([])
    lpush = vi.fn().mockResolvedValue(1)
    ltrim = vi.fn().mockResolvedValue('OK')
  },
}))

vi.mock('../../api/_prisma.ts', () => ({
  prisma: {
    siteConfig: { upsert: mockSiteConfigUpsert, findUnique: mockSiteConfigFindUnique },
    release: { findMany: mockReleaseFindMany, findUnique: mockReleaseFindUnique, create: mockReleaseCreate, update: mockReleaseUpdate, delete: mockReleaseDelete },
    gig: { findMany: mockGigFindMany, create: mockGigCreate, delete: mockGigDelete },
    video: { findMany: mockVideoFindMany, delete: mockVideoDelete },
    activityLog: { create: mockActivityCreate },
  },
}))

// Mock auth.ts — CMS endpoints call validateSession directly
vi.mock('../../api/auth.ts', () => ({
  validateSession: vi.fn().mockResolvedValue(true),
  getSessionFromCookie: vi.fn().mockReturnValue('test-token'),
  hashPassword: vi.fn().mockResolvedValue('hashed'),
}))

vi.mock('../../api/_ratelimit.ts', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(true),
  applyAuthRateLimit: vi.fn().mockResolvedValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  hashIp: vi.fn().mockReturnValue('hash123'),
}))

// Static imports of mocked modules — required for vi.mocked() to work correctly
import * as authMod from '../../api/auth.ts'
import * as ratelimitMod from '../../api/_ratelimit.ts'

// -------------------------------------------------------------------------
// Import handlers (dynamic import so vi.mock is applied before handler reads it)
// -------------------------------------------------------------------------
const { default: siteConfigHandler } = await import('../../api/cms/site-config.ts')
const { default: releasesHandler } = await import('../../api/cms/releases.ts')
const { default: gigsHandler } = await import('../../api/cms/gigs.ts')
const { default: videosHandler } = await import('../../api/cms/videos.ts')

// -------------------------------------------------------------------------
// Mock Response helper
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

beforeEach(() => {
  vi.clearAllMocks()
  // Restore mocks to their default values after clearAllMocks
  vi.mocked(authMod.validateSession).mockResolvedValue(true)
  vi.mocked(ratelimitMod.applyRateLimit).mockResolvedValue(true)
  mockActivityCreate.mockResolvedValue({})
})

// -------------------------------------------------------------------------
// Site Config
// -------------------------------------------------------------------------

describe('CMS Site Config — GET', () => {
  it('returns site config', async () => {
    const config = { id: 'main', siteName: 'Zardonic' }
    mockSiteConfigUpsert.mockResolvedValue(config)
    const res = mockRes()
    await siteConfigHandler({ method: 'GET', headers: {} } as never, res as never)
    expect(res._status).toBe(200)
    expect(res._json).toEqual(config)
  })

  it('returns 405 for DELETE', async () => {
    const res = mockRes()
    await siteConfigHandler({ method: 'DELETE', headers: {} } as never, res as never)
    expect(res._status).toBe(405)
  })
})

describe('CMS Site Config — PUT', () => {
  it('updates config with valid body', async () => {
    const updated = { id: 'main', siteName: 'New Name' }
    mockSiteConfigUpsert.mockResolvedValue(updated)
    const res = mockRes()
    await siteConfigHandler({ method: 'PUT', headers: {}, body: { siteName: 'New Name' } } as never, res as never)
    expect(res._status).toBe(200)
    expect(res._json).toEqual(updated)
  })

  it('rejects PUT with oversized siteName', async () => {
    const res = mockRes()
    await siteConfigHandler({ method: 'PUT', headers: {}, body: { siteName: 'x'.repeat(201) } } as never, res as never)
    expect(res._status).toBe(400)
  })
})

// -------------------------------------------------------------------------
// Releases
// -------------------------------------------------------------------------

describe('CMS Releases — GET list', () => {
  it('returns empty array when no releases', async () => {
    mockReleaseFindMany.mockResolvedValue([])
    const res = mockRes()
    await releasesHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(res._status).toBe(200)
    expect(res._json).toEqual([])
  })

  it('returns list of releases', async () => {
    const releases = [{ id: '1', title: 'Album 1', isDraft: false }]
    mockReleaseFindMany.mockResolvedValue(releases)
    const res = mockRes()
    await releasesHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(res._json).toEqual(releases)
  })
})

describe('CMS Releases — POST', () => {
  it('creates a release with valid body', async () => {
    const created = { id: 'new1', title: 'Single', type: 'single', isDraft: true }
    mockReleaseCreate.mockResolvedValue(created)
    const res = mockRes()
    await releasesHandler({ method: 'POST', headers: {}, query: {}, body: { title: 'Single', type: 'single' } } as never, res as never)
    expect(res._status).toBe(201)
    expect((res._json as { id: string }).id).toBe('new1')
  })

  it('rejects invalid release type', async () => {
    const res = mockRes()
    await releasesHandler({ method: 'POST', headers: {}, query: {}, body: { title: 'Test', type: 'mixtape' } } as never, res as never)
    expect(res._status).toBe(400)
  })
})

describe('CMS Releases — DELETE', () => {
  it('deletes a release by id', async () => {
    mockReleaseDelete.mockResolvedValue({ id: 'r1' })
    const res = mockRes()
    await releasesHandler({ method: 'DELETE', headers: {}, query: { id: 'r1' } } as never, res as never)
    expect(res._status).toBe(200)
    expect(res._json).toEqual({ ok: true })
  })
})

// -------------------------------------------------------------------------
// Gigs
// -------------------------------------------------------------------------

describe('CMS Gigs — POST', () => {
  it('creates a gig with valid body', async () => {
    const created = { id: 'gig1', title: 'Berlin Show', isDraft: true }
    mockGigCreate.mockResolvedValue(created)
    const res = mockRes()
    await gigsHandler({
      method: 'POST', headers: {}, query: {},
      body: { title: 'Berlin Show', venue: 'Berghain', city: 'Berlin', country: 'Germany', date: '2025-06-15T20:00:00.000Z' },
    } as never, res as never)
    expect(res._status).toBe(201)
  })

  it('rejects gig without required fields', async () => {
    const res = mockRes()
    await gigsHandler({ method: 'POST', headers: {}, query: {}, body: { title: 'Incomplete' } } as never, res as never)
    expect(res._status).toBe(400)
  })
})

describe('CMS Gigs — GET', () => {
  it('returns list of gigs', async () => {
    mockGigFindMany.mockResolvedValue([{ id: 'g1', title: 'Gig 1' }])
    const res = mockRes()
    await gigsHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(res._status).toBe(200)
    expect(Array.isArray(res._json)).toBe(true)
  })
})

// -------------------------------------------------------------------------
// Videos
// -------------------------------------------------------------------------

describe('CMS Videos — GET list', () => {
  it('returns empty list', async () => {
    mockVideoFindMany.mockResolvedValue([])
    const res = mockRes()
    await videosHandler({ method: 'GET', headers: {}, query: {} } as never, res as never)
    expect(res._status).toBe(200)
    expect(res._json).toEqual([])
  })
})

describe('CMS Videos — DELETE', () => {
  it('deletes a video', async () => {
    mockVideoDelete.mockResolvedValue({ id: 'v1' })
    const res = mockRes()
    await videosHandler({ method: 'DELETE', headers: {}, query: { id: 'v1' } } as never, res as never)
    expect(res._status).toBe(200)
    expect(res._json).toEqual({ ok: true })
  })
})
