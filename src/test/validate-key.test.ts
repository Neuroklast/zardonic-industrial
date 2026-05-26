import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — declared before importing the handler
// ---------------------------------------------------------------------------
const mockSismember = vi.fn()
const mockHgetall = vi.fn()

vi.mock('@upstash/redis', () => ({
  Redis: class {
    sismember = mockSismember
    hgetall = mockHgetall
  },
}))

const mockApplyRateLimit = vi.fn()
vi.mock('../../api/_ratelimit.ts', () => ({
  applyRateLimit: mockApplyRateLimit,
}))

vi.mock('../../api/_primary-check.ts', () => ({
  isPrimaryHost: vi.fn().mockReturnValue(false),
}))

function mockRes() {
  const statusMock = vi.fn().mockReturnThis()
  const jsonMock = vi.fn().mockReturnThis()
  const setHeaderMock = vi.fn().mockReturnThis()
  const endMock = vi.fn().mockReturnThis()
  return {
    status: statusMock,
    json: jsonMock,
    setHeader: setHeaderMock,
    end: endMock,
  }
}

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'POST',
    headers: { host: 'fork.example.com' },
    body: { key: 'valid-activation-key' },
    ...overrides,
  }
}

const { default: handler } = await import('../../api/validate-key.ts')

describe('POST /api/validate-key', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyRateLimit.mockResolvedValue(true)
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
  })

  it('applies rate limiting before key validation', async () => {
    mockSismember.mockResolvedValue(1)
    mockHgetall.mockResolvedValue(null)
    const res = mockRes()
    await handler(makeReq() as any, res as any)
    expect(mockApplyRateLimit).toHaveBeenCalledTimes(1)
  })

  it('returns 429 and stops processing when rate limit is exceeded', async () => {
    // applyRateLimit sends the 429 response itself and returns false
    mockApplyRateLimit.mockImplementation((_req: unknown, r: { status: (c: number) => unknown; json: (d: unknown) => unknown }) => {
      r.status(429)
      r.json({ error: 'Too Many Requests' })
      return Promise.resolve(false)
    })
    const res = mockRes()
    await handler(makeReq() as any, res as any)
    // Key validation must NOT have been attempted
    expect(mockSismember).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(429)
  })

  it('returns valid:true for a known key', async () => {
    mockSismember.mockResolvedValue(1)
    mockHgetall.mockResolvedValue({ tier: 'pro', features: '[]', assignedThemes: '[]' })
    const res = mockRes()
    await handler(makeReq() as any, res as any)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ valid: true, tier: 'pro' }))
  })

  it('returns valid:false for an unknown key', async () => {
    mockSismember.mockResolvedValue(0)
    const res = mockRes()
    await handler(makeReq() as any, res as any)
    expect(res.json).toHaveBeenCalledWith({ valid: false })
  })

  it('returns 400 for missing key', async () => {
    const res = mockRes()
    await handler(makeReq({ body: {} }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 405 for non-POST methods', async () => {
    const res = mockRes()
    await handler(makeReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })
})
