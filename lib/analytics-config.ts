export interface AnalyticsConfig {
  enabled: boolean
  trackPageViews: boolean
  trackEvents: boolean
}

/** Matches admin analytics page defaults when a key is absent from site_config. */
export function parseAnalyticsConfig(raw: unknown): AnalyticsConfig {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    enabled: obj.enabled !== false,
    trackPageViews: obj.trackPageViews !== false,
    trackEvents: obj.trackEvents !== false,
  }
}

export function isAnalyticsTrackingAllowed(
  config: AnalyticsConfig,
  type: 'page_view' | 'section_view' | 'interaction' | 'click',
): boolean {
  if (!config.enabled) return false
  if (type === 'page_view') return config.trackPageViews
  return config.trackEvents
}