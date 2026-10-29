import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequireAdmin, mockListFactors, mockEnroll, mockVerify, mockAssurance } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockListFactors: vi.fn(),
  mockEnroll: vi.fn(),
  mockVerify: vi.fn(),
  mockAssurance: vi.fn(),
}))

vi.mock('@/app/admin/_actions/auth', () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}))

vi.mock('@/lib/supabaseServer', () => ({
  createActionClient: async () => ({
    auth: {
      mfa: {
        listFactors: (...args: unknown[]) => mockListFactors(...args),
        enroll: (...args: unknown[]) => mockEnroll(...args),
        challengeAndVerify: (...args: unknown[]) => mockVerify(...args),
        getAuthenticatorAssuranceLevel: (...args: unknown[]) => mockAssurance(...args),
      },
    },
  }),
}))

import { beginAdminMfaEnrollment, verifyAdminMfa } from '@/app/admin/_actions/mcpMfa'

describe('MFA-protected ZARDONIC OAuth administration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(undefined)
    mockListFactors.mockResolvedValue({ data: { totp: [] }, error: null })
    mockEnroll.mockResolvedValue({
      data: { id: '4ff04d7a-2723-48a4-aa93-3259bd594285', totp: { qr_code: 'data:image/svg+xml;base64,abc', secret: 'test-secret' } },
      error: null,
    })
    mockVerify.mockResolvedValue({ data: { access_token: 'new-session-token' }, error: null })
    mockAssurance.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null })
  })

  it('rejects enrollment when the current session is not an administrator', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('forbidden'))
    expect(await beginAdminMfaEnrollment()).toMatchObject({ success: false })
    expect(mockEnroll).not.toHaveBeenCalled()
  })

  it('allows only one verified authenticator enrollment by default', async () => {
    mockListFactors.mockResolvedValue({ data: { totp: [{ id: 'verified-factor' }] }, error: null })
    expect(await beginAdminMfaEnrollment()).toMatchObject({ success: false })
    expect(mockEnroll).not.toHaveBeenCalled()
  })

  it('enrolls TOTP through Supabase Auth, not a custom stored secret', async () => {
    const response = await beginAdminMfaEnrollment()
    expect(response).toMatchObject({ success: true, factorId: '4ff04d7a-2723-48a4-aa93-3259bd594285' })
    expect(mockEnroll).toHaveBeenCalledWith({ factorType: 'totp', friendlyName: 'ZARDONIC Admin' })
  })

  it('rejects malformed OTPs without calling Supabase verify', async () => {
    const result = await verifyAdminMfa('4ff04d7a-2723-48a4-aa93-3259bd594285', '12345')
    expect(result.success).toBe(false)
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('requires verified AAL2 after a valid challenge', async () => {
    mockAssurance.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null })
    expect(await verifyAdminMfa('4ff04d7a-2723-48a4-aa93-3259bd594285', '123456'))
      .toMatchObject({ success: false })
    mockAssurance.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null })
    expect(await verifyAdminMfa('4ff04d7a-2723-48a4-aa93-3259bd594285', '123456'))
      .toEqual({ success: true })
  })
})
