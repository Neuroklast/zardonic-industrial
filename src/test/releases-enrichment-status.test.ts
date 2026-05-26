import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — declared before importing the handler
// ---------------------------------------------------------------------------
const mockRedisGet = vi.fn()

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = mockRedisGet
  },
}))

const mockValidateSession = vi.fn()
vi.mock('../../api/auth.ts', () => ({
  validateSession: mockValidateSession,
}))

type MockRes = {
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
}

function mockRes(): MockRes {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

function makeReq() {
  return { method: 'GET', headers: {} }
}

const { default: handler } = await import('../../api/releases-enrichment-status.ts')

describe('GET /api/releases-enrichment-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateSession.mockResolvedValue(true)
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
  })

  it('returns total, pendingCount, and pending from real queue data', async () => {
    // Simulate: 5 releases in band-data, 3 already processed → 2 still pending
    mockRedisGet.mockImplementation((key: string) => {
      if (key === 'band-data') {
        return Promise.resolve({
          releases: [
            { id: '1', title: 'A' }, { id: '2', title: 'B' }, { id: '3', title: 'C' },
            { id: '4', title: 'D' }, { id: '5', title: 'E' },
          ],
        })
      }
      if (key === 'releases-enrich-queue') {
        return Promise.resolve({
          releases: [
            { id: '4', title: 'D' }, { id: '5', title: 'E' },
          ],
          processedCount: 0,
        })
      }
      return Promise.resolve(null)
    })

    const res = mockRes()
    await handler(makeReq() as any, res as any)

    expect(res.status).toHaveBeenCalledWith(200)
    const call = res.json.mock.calls[0]?.[0] as { total: number; pendingCount: number; pending: { id: string; title: string }[] }
    expect(call.total).toBe(5)
    expect(call.pendingCount).toBe(2)
    expect(call.pending).toHaveLength(2)
  })

  it('returns zero pending when no enrichment queue exists', async () => {
    mockRedisGet.mockImplementation((key: string) => {
      if (key === 'band-data') {
        return Promise.resolve({ releases: [{ id: '1', title: 'A' }] })
      }
      return Promise.resolve(null) // no queue
    })

    const res = mockRes()
    await handler(makeReq() as any, res as any)

    const call = res.json.mock.calls[0]?.[0] as { total: number; pendingCount: number; pending: unknown[] }
    expect(call.total).toBe(1)
    expect(call.pendingCount).toBe(0)
    expect(call.pending).toHaveLength(0)
  })

  it('returns 401 when not authenticated', async () => {
    mockValidateSession.mockResolvedValue(false)
    const res = mockRes()
    await handler(makeReq() as any, res as any)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 405 for non-GET methods', async () => {
    const res = mockRes()
    await handler({ method: 'POST', headers: {} } as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })
})
