import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const mockPut = vi.fn()
vi.mock('@vercel/blob', () => ({
  put: mockPut,
}))

const mockResolve4 = vi.fn()
const mockResolve6 = vi.fn()
vi.mock('node:dns/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:dns/promises')>()
  return {
    ...actual,
    resolve4: mockResolve4,
    resolve6: mockResolve6,
  }
})

const mockValidateSession = vi.fn()
vi.mock('../../api/auth.ts', () => ({
  validateSession: mockValidateSession,
}))

const mockApplyRateLimit = vi.fn()
vi.mock('../../api/_ratelimit.ts', () => ({
  applyRateLimit: mockApplyRateLimit,
}))

function mockRes() {
  const res: any = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res as VercelResponse
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'POST',
    headers: {},
    body: {},
    ...overrides,
  } as VercelRequest
}

describe('POST /api/cms/import-image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
    mockValidateSession.mockResolvedValue(true)
    mockApplyRateLimit.mockResolvedValue(true)
    mockResolve4.mockResolvedValue([])
    mockResolve6.mockResolvedValue([])
    mockPut.mockResolvedValue({ url: 'https://public.blob.vercel-storage.com/imported.png' })
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://images.example.com/cover.png',
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': '4',
      }),
      arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
    })
    vi.stubGlobal('fetch', mockFetch)
  })

  it('imports a remote image into Blob storage', async () => {
    const { default: handler } = await import('../../api/cms/import-image.ts')
    const res = mockRes()

    await handler(
      mockReq({ body: { url: 'https://images.example.com/cover.png' } }),
      res,
    )

    expect(mockPut).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://public.blob.vercel-storage.com/imported.png',
      mimeType: 'image/png',
      size: 4,
    }))
  })

  it('rejects blocked hosts before fetching', async () => {
    const { default: handler } = await import('../../api/cms/import-image.ts')
    const res = mockRes()

    await handler(
      mockReq({ body: { url: 'http://127.0.0.1/secret.png' } }),
      res,
    )

    expect(fetch).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Blocked host' })
  })

  it('returns 401 when not authenticated', async () => {
    mockValidateSession.mockResolvedValue(false)
    const { default: handler } = await import('../../api/cms/import-image.ts')
    const res = mockRes()

    await handler(mockReq({ body: { url: 'https://images.example.com/cover.png' } }), res)

    expect(res.status).toHaveBeenCalledWith(401)
  })
})
