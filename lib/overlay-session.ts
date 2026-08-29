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
    case 'gallery': {
      const idx = overlay.data?.initialIndex ?? 0
      const count = overlay.data?.images?.length ?? 0
      // Include index so reopening a different photo restarts the session animation
      return `gallery:${count}:${idx}`
    }
    case 'media':
      return overlay.data?.id ? `media:${overlay.data.id}` : 'media:unknown'
    default:
      return overlay.type
  }
}