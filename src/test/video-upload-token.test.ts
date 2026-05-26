import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — declared before importing the handler
// ---------------------------------------------------------------------------
const mockHandleUpload = vi.fn()
vi.mock('@vercel/blob/client', () => ({
  handleUpload: mockHandleUpload,
}))

const mockValidateSession = vi.fn()
vi.mock('../../api/auth.ts', () => ({
  validateSession: mockValidateSession,
}))

const mockApplyRateLimit = vi.fn()
vi.mock('../../api/_ratelimit.ts', () => ({
  applyRateLimit: mockApplyRateLimit,
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

const { default: handler } = await import('../../api/cms/video-upload-token.ts')

describe('POST /api/cms/video-upload-token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateSession.mockResolvedValue(true)
    mockApplyRateLimit.mockResolvedValue(true)
    process.env.BLOB_READ_WRITE_TOKEN = 'fake-blob-token'
    mockHandleUpload.mockResolvedValue({ url: 'https://blob.example.com/test.mp4' })
  })

  it('allows video/mp4 uploads', async () => {
    await handler({ method: 'POST', headers: {}, body: {} } as any, mockRes() as any)
    const call = mockHandleUpload.mock.calls[0]?.[0]
    const tokenResult = await call.onBeforeGenerateToken('test.mp4')
    expect(tokenResult.allowedContentTypes).toContain('video/mp4')
  })

  it('allows video/webm uploads', async () => {
    await handler({ method: 'POST', headers: {}, body: {} } as any, mockRes() as any)
    const call = mockHandleUpload.mock.calls[0]?.[0]
    const tokenResult = await call.onBeforeGenerateToken('test.webm')
    expect(tokenResult.allowedContentTypes).toContain('video/webm')
  })

  it('allows model/gltf-binary (.glb) uploads', async () => {
    await handler({ method: 'POST', headers: {}, body: {} } as any, mockRes() as any)
    const call = mockHandleUpload.mock.calls[0]?.[0]
    const tokenResult = await call.onBeforeGenerateToken('model.glb')
    expect(tokenResult.allowedContentTypes).toContain('model/gltf-binary')
  })

  it('allows model/gltf+json (.gltf) uploads', async () => {
    await handler({ method: 'POST', headers: {}, body: {} } as any, mockRes() as any)
    const call = mockHandleUpload.mock.calls[0]?.[0]
    const tokenResult = await call.onBeforeGenerateToken('model.gltf')
    expect(tokenResult.allowedContentTypes).toContain('model/gltf+json')
  })

  it('returns 401 when not authenticated', async () => {
    mockValidateSession.mockResolvedValue(false)
    const res = mockRes()
    await handler({ method: 'POST', headers: {}, body: {} } as any, res as any)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 503 when BLOB_READ_WRITE_TOKEN is missing', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN
    const res = mockRes()
    await handler({ method: 'POST', headers: {}, body: {} } as any, res as any)
    expect(res.status).toHaveBeenCalledWith(503)
  })
})
