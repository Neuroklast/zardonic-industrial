'use client'

import { useCallback, useRef } from 'react'
import { useAnalyticsConsent } from '@/lib/consent'
import {
  isAnalyticsTrackingAllowed,
  type AnalyticsConfig,
} from '@/lib/analytics-config'

export type AnalyticsEventType = 'page_view' | 'section_view' | 'interaction' | 'click'

export interface AnalyticsEventPayload {
  type: AnalyticsEventType
  target?: string
  meta?: {
    referrer?: string
    device?: string
    browser?: string
    screenResolution?: string
    landingPage?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    sessionId?: string
  }
  heatmap?: {
    x: number
    y: number
    page?: string
    elementTag?: string
  }
}

const SESSION_KEY = 'zd-analytics-session'

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return 'anonymous'
  }
}

function buildMeta(): AnalyticsEventPayload['meta'] {
  if (typeof window === 'undefined') return undefined
  return {
    referrer: document.referrer || undefined,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    landingPage: window.location.pathname,
    sessionId: getSessionId(),
  }
}

export function useAnalytics(config: AnalyticsConfig) {
  const hasConsent = useAnalyticsConsent()
  const inflightRef = useRef<Set<string>>(new Set())

  const track = useCallback(
    (payload: AnalyticsEventPayload) => {
      if (!hasConsent || !isAnalyticsTrackingAllowed(config, payload.type)) return

      const dedupeKey = `${payload.type}:${payload.target ?? ''}:${payload.heatmap?.x ?? ''}:${payload.heatmap?.y ?? ''}`
      if (inflightRef.current.has(dedupeKey)) return
      inflightRef.current.add(dedupeKey)
      setTimeout(() => inflightRef.current.delete(dedupeKey), 1000)

      const body = JSON.stringify({
        ...payload,
        meta: { ...buildMeta(), ...payload.meta },
      })

      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' })
          navigator.sendBeacon('/api/analytics', blob)
          return
        }
      } catch {
        // fall through to fetch
      }

      void fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Analytics must never break the UI
      })
    },
    [config, hasConsent],
  )

  return { track, canTrack: hasConsent && config.enabled }
}