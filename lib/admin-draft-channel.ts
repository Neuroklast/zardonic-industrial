export const ADMIN_DRAFT_CHANNEL = 'zardonic-admin-draft'

export type AdminDraftKey = 'appearance' | 'hero' | 'background' | 'newsletter' | 'merchandise' | 'footer'

export interface AdminDraftMessage {
  type: 'draft'
  key: AdminDraftKey
  value: Record<string, unknown>
  timestamp: number
}

export interface AdminDraftRefreshMessage {
  type: 'refresh'
  timestamp: number
}

export type AdminChannelMessage = AdminDraftMessage | AdminDraftRefreshMessage

export function isAdminDraftMessage(msg: unknown): msg is AdminDraftMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as AdminDraftMessage).type === 'draft' &&
    typeof (msg as AdminDraftMessage).key === 'string' &&
    typeof (msg as AdminDraftMessage).value === 'object'
  )
}

export function createAdminDraftChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(ADMIN_DRAFT_CHANNEL)
}

export function broadcastAdminDraft(key: AdminDraftKey, value: Record<string, unknown>): void {
  const channel = createAdminDraftChannel()
  if (!channel) return
  const message: AdminDraftMessage = { type: 'draft', key, value, timestamp: Date.now() }
  channel.postMessage(message)
  channel.close()
}

export function broadcastAdminRefresh(): void {
  const channel = createAdminDraftChannel()
  if (!channel) return
  const message: AdminDraftRefreshMessage = { type: 'refresh', timestamp: Date.now() }
  channel.postMessage(message)
  channel.close()
}