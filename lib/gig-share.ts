import type { Gig } from '@/lib/app-types'
import { formatIsoDateLong } from '@/lib/format-display-date'
import { getSiteOrigin } from '@/lib/og-share'

export function getGigShareUrl(gigId: string, origin?: string): string {
  const base = (origin ?? (typeof window !== 'undefined' ? window.location.origin : getSiteOrigin())).replace(
    /\/$/,
    '',
  )
  return `${base}/api/og?type=gig&id=${encodeURIComponent(gigId)}`
}

export function buildGigSharePayload(gig: Gig, artistName: string, origin?: string) {
  const url = getGigShareUrl(gig.id, origin)
  const title = `${artistName} @ ${gig.venue}`
  const text = [formatIsoDateLong(gig.date), gig.location].filter(Boolean).join(' — ')
  return { title, text, url }
}

export async function shareGigEvent(gig: Gig, artistName: string): Promise<'shared' | 'copied'> {
  const payload = buildGigSharePayload(gig, artistName)

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload.url)
    return 'copied'
  }

  throw new Error('Sharing is not supported in this browser')
}