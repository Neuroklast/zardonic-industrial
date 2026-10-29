import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockActiveClient, mockUpsert, mockRpc, mockFrom } = vi.hoisted(() => ({
  mockActiveClient: vi.fn(), mockUpsert: vi.fn(), mockRpc: vi.fn(), mockFrom: vi.fn(),
}))

vi.mock('@/lib/mcp/client-registry', () => ({ getActiveMcpClient: mockActiveClient }))
vi.mock('@/lib/supabaseAdmin', () => ({ createAdminClient: () => ({
  from: mockFrom, rpc: mockRpc,
}) }))
import { attestMcpOAuthMfa, verifyMcpOAuthMfaGrant } from '@/lib/mcp/mfa-grants'

const userId = '00000000-0000-4000-8000-000000000001'
const sessionId = '00000000-0000-4000-8000-000000000002'
const clientId = '27373656-347b-49df-a452-550198edc379'

describe('MFA-approved OAuth delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActiveClient.mockResolvedValue({ client_id: clientId, enabled: true })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockResolvedValue({ error: null })
    mockRpc.mockResolvedValue({ data: true, error: null })
  })

  it('records a bounded grant for an allowlisted client without exposing a browser-side API', async () => {
    await attestMcpOAuthMfa(userId, clientId)
    expect(mockFrom).toHaveBeenCalledWith('mcp_oauth_mfa_grants')
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: userId, client_id: clientId,
      verified_at: expect.any(String), expires_at: expect.any(String),
    }), { onConflict: 'user_id,client_id' })
    const grant = mockUpsert.mock.calls[0][0]
    const duration = new Date(grant.expires_at).getTime() - new Date(grant.verified_at).getTime()
    expect(duration).toBe(30 * 24 * 60 * 60 * 1000)
  })

  it('refuses to attest a disabled client', async () => {
    mockActiveClient.mockResolvedValue(null)
    await expect(attestMcpOAuthMfa(userId, clientId)).rejects.toThrow('not authorized')
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('validates the genuine OAuth session with the protected database RPC', async () => {
    expect(await verifyMcpOAuthMfaGrant(userId, clientId, sessionId)).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('mcp_verify_oauth_mfa_grant', {
      p_session_id: sessionId, p_user_id: userId, p_client_id: clientId,
    })
  })

  it('rejects invalid sessions without calling the database', async () => {
    expect(await verifyMcpOAuthMfaGrant(userId, clientId, 'not-a-uuid')).toBe(false)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('fails closed on a database error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    await expect(verifyMcpOAuthMfaGrant(userId, clientId, sessionId)).rejects.toThrow('unavailable')
  })
})
