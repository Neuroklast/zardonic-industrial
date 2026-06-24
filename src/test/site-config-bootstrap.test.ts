import { describe, it, expect } from 'vitest'
import { parseAnalyticsConfig, isAnalyticsTrackingAllowed } from '@/lib/analytics-config'
import { parseLanguagesConfig } from '@/lib/languages-config'
import { parseTranslationsConfig } from '@/lib/translations-config'

describe('parseAnalyticsConfig', () => {
  it('defaults to enabled when keys are absent', () => {
    expect(parseAnalyticsConfig({})).toEqual({
      enabled: true,
      trackPageViews: true,
      trackEvents: true,
    })
  })

  it('respects explicit false flags from site_config seed', () => {
    expect(
      parseAnalyticsConfig({
        enabled: false,
        trackPageViews: false,
        trackEvents: false,
      }),
    ).toEqual({
      enabled: false,
      trackPageViews: false,
      trackEvents: false,
    })
  })
})

describe('isAnalyticsTrackingAllowed', () => {
  const disabled = parseAnalyticsConfig({ enabled: false })

  it('blocks all events when analytics is disabled', () => {
    expect(isAnalyticsTrackingAllowed(disabled, 'page_view')).toBe(false)
    expect(isAnalyticsTrackingAllowed(disabled, 'click')).toBe(false)
  })

  it('gates page views separately from interaction events', () => {
    const config = parseAnalyticsConfig({
      enabled: true,
      trackPageViews: false,
      trackEvents: true,
    })
    expect(isAnalyticsTrackingAllowed(config, 'page_view')).toBe(false)
    expect(isAnalyticsTrackingAllowed(config, 'click')).toBe(true)
  })
})

describe('parseTranslationsConfig', () => {
  it('returns empty object for invalid input', () => {
    expect(parseTranslationsConfig(null)).toEqual({})
    expect(parseTranslationsConfig([])).toEqual({})
  })

  it('keeps only non-empty locale strings', () => {
    expect(
      parseTranslationsConfig({
        'footer.privacy': { en: 'Privacy', de: '' },
        'newsletter.subscribe': { en: 'Join', de: 'Abonnieren' },
        invalid: 'nope',
      }),
    ).toEqual({
      'footer.privacy': { en: 'Privacy' },
      'newsletter.subscribe': { en: 'Join', de: 'Abonnieren' },
    })
  })
})