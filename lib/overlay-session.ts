import type { CyberpunkOverlayState } from '@/lib/app-types'

/** Stable key for overlay open/close cycles — avoids effect loops on object identity churn. */
export function getOverlaySessionKey(overlay: CyberpunkOverlayState | null): string | null {
  if (!overlay) return null

  switch (overlay.type) {
    case 'release':
      return overlay.data?.id ? `release:${overlay.data.id}` : 'release:unknown'
    case 'gig':
      return overlay.data?.id ? `gig:${overlay.data.id}` : 'gig:unknown'
    case 'member':
      return overlay.data?.id ? `member:${overlay.data.id}` : 'member:unknown'
    default:
      return overlay.type
  }
}