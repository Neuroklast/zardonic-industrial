import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock @vercel/kv
// ---------------------------------------------------------------------------
const mockSismember = vi.fn()
const mockHgetall = vi.fn()

vi.mock('@vercel/kv', () => ({
  kv: {
    sismember: (...args: unknown[]) => mockSismember(...args),
    hgetall: (...args: unknown[]) => mockHgetall(...args),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type MockRes = {
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  setHeader: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
}

function mockRes(): MockRes {
  const res: MockRes = {
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
    end: vi.fn(),
  }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.setHeader.mockReturnValue(res)
  res.end.mockReturnValue(res)
  return res
}

const { default: handler } = await import('../../api/validate-key.ts')

// ---------------------------------------------------------------------------
describe('validate-key API handler', () => {
  beforeEach(() => {
    mockSismember.mockReset()
    mockHgetall.mockReset()
  })

  it('OPTIONS returns 200 (CORS preflight)', async () => {
    const res = mockRes()
    await handler(
      { method: 'OPTIONS', body: {}, headers: {} } as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.end).toHaveBeenCalled()
  })

  it('non-POST method returns 405', async () => {
    const res = mockRes()
    await handler(
      { method: 'GET', body: {}, headers: {} } as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('POST with empty key returns 400', async () => {
    const res = mockRes()
    await handler(
      { method: 'POST', body: { key: '' }, headers: {} } as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('POST with missing key returns 400', async () => {
    const res = mockRes()
    await handler(
      { method: 'POST', body: {}, headers: {} } as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('primary host returns valid with agency tier', async () => {
    const res = mockRes()
    await handler(
      {
        method: 'POST',
        body: { key: 'any' },
        headers: { host: 'zardonic-industrial.vercel.app' },
      } as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ valid: true, tier: 'agency' }),
    )
  })

  it('POST with valid key returns valid result', async () => {
    mockSismember.mockResolvedValue(1)
    mockHgetall.mockResolvedValue({ tier: 'premium', features: '["feat1"]', assignedThemes: '["dark"]' })

    const res = mockRes()
    await handler(
      { method: 'POST', body: { key: 'valid-key-123' }, headers: {} } as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: true,
        tier: 'premium',
        features: ['feat1'],
        assignedThemes: ['dark'],
      }),
    )
  })

  it('POST with invalid key returns valid:false', async () => {
    mockSismember.mockResolvedValue(0)

    const res = mockRes()
    await handler(
      { method: 'POST', body: { key: 'bad-key' }, headers: {} } as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ valid: false })
  })

  it('sets CORS headers on all responses', async () => {
    const res = mockRes()
    await handler(
      { method: 'POST', body: { key: '' }, headers: {} } as any,
      res as any,
    )
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS')
  })
})
