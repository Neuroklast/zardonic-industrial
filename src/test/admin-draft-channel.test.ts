import { describe, expect, it } from 'vitest'
import { isAdminDraftMessage, ADMIN_DRAFT_CHANNEL } from '@/lib/admin-draft-channel'

describe('admin-draft-channel', () => {
  it('uses stable channel name', () => {
    expect(ADMIN_DRAFT_CHANNEL).toBe('zardonic-admin-draft')
  })

  it('recognizes valid draft messages', () => {
    expect(
      isAdminDraftMessage({
        type: 'draft',
        key: 'appearance',
        value: { accentColor: '#fff' },
        timestamp: Date.now(),
      }),
    ).toBe(true)
  })

  it('rejects invalid messages', () => {
    expect(isAdminDraftMessage({ type: 'other' })).toBe(false)
    expect(isAdminDraftMessage(null)).toBe(false)
  })
})