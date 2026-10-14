import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseAnalyticsConfig, isAnalyticsTrackingAllowed } from '@/lib/analytics-config'
import { parseLanguagesConfig } from '@/lib/languages-config'
import { parseTranslationsConfig } from '@/lib/translations-config'
import { getPublicSiteBootstrap } from '@/lib/site-config-bootstrap'

// Simulate the production build without Supabase env: the client throws.
vi.mock('@/lib/supabaseServer', () => ({
  createPublicClient: () => {
    throw new Error('Missing required Supabase environment variables')
  },
  isSupabaseConfigured: () =>
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
}))

describe('getPublicSiteBootstrap build safety', () => {
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedKey
  })

  it('degrades to defaults when Supabase is not configured (CI build)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    await expect(getPublicSiteBootstrap()).resolves.toEqual({
      customTranslations: {},
      analyticsConfig: parseAnalyticsConfig(null),
      languages: parseLanguagesConfig(null),
      appearance: {},
    })
  })

  it('rethrows when Supabase is configured (real outage must not cache empty)', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'

    await expect(getPublicSiteBootstrap()).rejects.toThrow()
  })
})


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