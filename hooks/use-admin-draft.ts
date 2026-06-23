'use client'

import { useCallback, useEffect } from 'react'
import {
  ADMIN_DRAFT_CHANNEL,
  broadcastAdminDraft,
  broadcastAdminRefresh,
  isAdminDraftMessage,
  type AdminChannelMessage,
  type AdminDraftKey,
} from '@/lib/admin-draft-channel'

export { broadcastAdminDraft, broadcastAdminRefresh }

export function useAdminDraftBroadcast(
  key: AdminDraftKey,
  value: Record<string, unknown>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return
    broadcastAdminDraft(key, value)
  }, [key, value, enabled])
}

export function useAdminDraftListener(
  onDraft: (key: AdminDraftKey, value: Record<string, unknown>) => void,
  onRefresh?: () => void,
): void {
  const handleMessage = useCallback(
    (event: MessageEvent<AdminChannelMessage>) => {
      const data = event.data
      if (isAdminDraftMessage(data)) {
        onDraft(data.key, data.value)
        return
      }
      if (data?.type === 'refresh') {
        onRefresh?.()
      }
    },
    [onDraft, onRefresh],
  )

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(ADMIN_DRAFT_CHANNEL)
    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [handleMessage])
}