import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequireAdmin, mockUserId, mockAssurance, mockFrom, mockMaybeSingle, mockInsert, mockDelete, mockUpdate, mockRevalidate } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockUserId: vi.fn(),
  mockAssurance: vi.fn(),
  mockFrom: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
  mockUpdate: vi.fn(),
  mockRevalidate: vi.fn(),
}))

vi.mock('@/app/admin/_actions/auth', () => ({ requireAdmin: mockRequireAdmin }))
vi.mock('@/lib/api-admin-auth', () => ({ getAdminUserId: mockUserId }))
vi.mock('@/lib/supabaseServer', () => ({
  createActionClient: async () => ({ auth: { mfa: { getAuthenticatorAssuranceLevel: mockAssurance } } }),
}))
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidate }))

const chain = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: mockMaybeSingle,
  update: mockUpdate,
  delete: mockDelete,
  insert: mockInsert,
}
vi.mock('@/lib/supabaseAdmin', () => ({ createAdminClient: () => ({ from: mockFrom }) }))

import { deleteMcpClient, registerMcpClient, setMcpClientEnabled } from '@/app/admin/_actions/mcpIntegrations'

const clientId = '27373656-347b-49df-a452-550198edc379'
const entry = { client_id: clientId, provider: 'claude', display_name: 'NK GPT', enabled: true }

function form() {
  const fd = new FormData()
  fd.set('client_id', clientId)
  fd.set('provider', 'claude')
  fd.set('display_name', 'NK GPT')
  return fd
}

describe('MCP OAuth client admin management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(undefined)
    mockUserId.mockResolvedValue('00000000-0000-4000-8000-000000000001')
    mockAssurance.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null })
    mockFrom.mockReturnValue(chain)
    chain.select.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    mockUpdate.mockReturnValue(chain)
    mockDelete.mockReturnValue(chain)
    mockMaybeSingle.mockResolvedValue({ data: entry, error: null })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('returns already registered instead of a misleading MFA error', async () => {
    expect(await registerMcpClient(form())).toEqual({ success: true, outcome: 'unchanged' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('allows editing an existing client without adding a duplicate', async () => {
    const changed = form()
    changed.set('provider', 'other')
    changed.set('display_name', 'ZARDONIC ChatGPT')
    expect(await registerMcpClient(changed)).toEqual({ success: true, outcome: 'updated' })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'other', display_name: 'ZARDONIC ChatGPT', enabled: true,
    }))
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('inserts a valid new client when it does not exist', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect(await registerMcpClient(form())).toEqual({ success: true, outcome: 'added' })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ client_id: clientId, enabled: true }))
  })

  it('deletes only the selected OAuth client after verifying administrator MFA', async () => {
    expect(await deleteMcpClient(clientId)).toEqual({ success: true, outcome: 'deleted' })
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(chain.eq).toHaveBeenCalledWith('client_id', clientId)
    expect(mockRevalidate).toHaveBeenCalledWith('/admin/integrations')
  })

  it('rejects deletion when MFA has not been verified', async () => {
    mockAssurance.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null })
    expect(await deleteMcpClient(clientId)).toEqual({ success: false, error: 'mfa' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('rejects malformed client IDs before database deletion', async () => {
    expect(await deleteMcpClient('../../other')).toEqual({ success: false, error: 'invalid' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns database errors separately from MFA errors', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { code: '42P01' } })
    expect(await deleteMcpClient(clientId)).toEqual({ success: false, error: 'database' })
  })

  it('preserves existing state on duplicate toggle', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await setMcpClientEnabled(clientId, true)).toEqual({ success: true, outcome: 'unchanged' })
  })
})
