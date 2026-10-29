import { beforeEach, describe, expect, it, vi } from 'vitest'

const { select, eq, maybeSingle, from } = vi.hoisted(() => ({
  select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), from: vi.fn(),
}))

vi.mock('@/lib/supabaseAdmin', () => ({
  createAdminClient: () => ({ from }),
}))

import { getActiveMcpClient } from '@/lib/mcp/client-registry'

describe('OAuth MCP client allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    from.mockReturnValue({ select })
    select.mockReturnValue({ eq })
    eq.mockReturnValue({ eq, maybeSingle })
    maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('never queries the database for malformed client identifiers', async () => {
    expect(await getActiveMcpClient('../../danger')).toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it('denies clients that are not explicitly registered and enabled', async () => {
    expect(await getActiveMcpClient('valid-but-unregistered')).toBeNull()
    expect(from).toHaveBeenCalledWith('mcp_oauth_clients')
    expect(eq).toHaveBeenCalledWith('enabled', true)
  })

  it('returns the authorized client for an enabled registry entry', async () => {
    const client = {
      client_id: 'client-registered', provider: 'claude',
      display_name: 'Claude', enabled: true, created_at: '', updated_at: '',
    }
    maybeSingle.mockResolvedValue({ data: client, error: null })
    expect(await getActiveMcpClient('client-registered')).toEqual(client)
  })

  it('fails closed on unavailable database permissions', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'db unavailable' } })
    await expect(getActiveMcpClient('client-registered')).rejects.toThrow('allowlist unavailable')
  })
})
