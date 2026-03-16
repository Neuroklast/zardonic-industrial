import { describe, it, expect } from 'vitest'
import {
  createSiteConfig,
  generateSiteId,
  migrateFromLegacyBandData,
  DEFAULT_SITE_CONFIG,
  TEMPLATE_VERSION,
} from '@/lib/site-config'

// ---------------------------------------------------------------------------
describe('DEFAULT_SITE_CONFIG', () => {
  it('has all required fields', () => {
    expect(DEFAULT_SITE_CONFIG.siteId).toBe('')
    expect(DEFAULT_SITE_CONFIG.siteType).toBe('band')
    expect(DEFAULT_SITE_CONFIG.siteName).toBe('')
    expect(DEFAULT_SITE_CONFIG.setupComplete).toBe(false)
    expect(DEFAULT_SITE_CONFIG.templateVersion).toBe(TEMPLATE_VERSION)
    expect(Array.isArray(DEFAULT_SITE_CONFIG.genres)).toBe(true)
    expect(DEFAULT_SITE_CONFIG.socialLinks).toEqual({})
    expect(Array.isArray(DEFAULT_SITE_CONFIG.gigs)).toBe(true)
    expect(Array.isArray(DEFAULT_SITE_CONFIG.releases)).toBe(true)
    expect(Array.isArray(DEFAULT_SITE_CONFIG.sectionOrder)).toBe(true)
    expect(DEFAULT_SITE_CONFIG.navigation).toBeDefined()
    expect(DEFAULT_SITE_CONFIG.footer).toBeDefined()
    expect(DEFAULT_SITE_CONFIG.seo).toBeDefined()
    expect(DEFAULT_SITE_CONFIG.features).toBeDefined()
  })

  it('has expected default features', () => {
    expect(DEFAULT_SITE_CONFIG.features.contactForm).toBe(true)
    expect(DEFAULT_SITE_CONFIG.features.newsletter).toBe(false)
    expect(DEFAULT_SITE_CONFIG.features.terminal).toBe(true)
    expect(DEFAULT_SITE_CONFIG.features.gallery).toBe(true)
  })
})

// ---------------------------------------------------------------------------
describe('generateSiteId()', () => {
  it('returns a non-empty string', () => {
    const id = generateSiteId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns unique IDs on each call', () => {
    const id1 = generateSiteId()
    const id2 = generateSiteId()
    expect(id1).not.toBe(id2)
  })
})

// ---------------------------------------------------------------------------
describe('createSiteConfig()', () => {
  it('merges partial with defaults', () => {
    const config = createSiteConfig({ siteName: 'Zardonic' })
    expect(config.siteName).toBe('Zardonic')
    expect(config.siteType).toBe('band')
    expect(config.templateVersion).toBe(TEMPLATE_VERSION)
  })

  it('generates siteId when not provided', () => {
    const config = createSiteConfig({})
    expect(config.siteId).toBeTruthy()
  })

  it('preserves provided siteId', () => {
    const config = createSiteConfig({ siteId: 'my-id' })
    expect(config.siteId).toBe('my-id')
  })

  it('always stamps current templateVersion', () => {
    const config = createSiteConfig({ templateVersion: '1.0.0' } as any)
    expect(config.templateVersion).toBe(TEMPLATE_VERSION)
  })

  it('sets createdAt and updatedAt', () => {
    const config = createSiteConfig({})
    expect(config.createdAt).toBeTruthy()
    expect(config.updatedAt).toBeTruthy()
  })

  it('merges nested navigation', () => {
    const config = createSiteConfig({
      navigation: { showLanguageSwitcher: false, showAudioPlayer: true },
    })
    expect(config.navigation.showLanguageSwitcher).toBe(false)
    expect(config.navigation.showAudioPlayer).toBe(true)
  })

  it('merges nested features', () => {
    const config = createSiteConfig({
      features: { newsletter: true } as any,
    })
    expect(config.features.newsletter).toBe(true)
    expect(config.features.contactForm).toBe(true)
  })
})

// ---------------------------------------------------------------------------
describe('migrateFromLegacyBandData()', () => {
  it('converts legacy band data to SiteConfig', () => {
    const legacy = {
      name: 'Zardonic',
      genres: ['DnB', 'Metal'],
      socialLinks: { instagram: 'https://instagram.com/zardonic' },
      gigs: [{ venue: 'Club X' }],
      releases: [],
    }
    const config = migrateFromLegacyBandData(legacy)

    expect(config.siteName).toBe('Zardonic')
    expect(config.setupComplete).toBe(true)
    expect(config.genres).toEqual(['DnB', 'Metal'])
    expect(config.socialLinks).toEqual({ instagram: 'https://instagram.com/zardonic' })
    expect(config.gigs).toHaveLength(1)
    expect(config.templateVersion).toBe(TEMPLATE_VERSION)
  })

  it('handles empty legacy data', () => {
    const config = migrateFromLegacyBandData({})
    expect(config.siteName).toBe('')
    expect(config.genres).toEqual([])
    expect(config.setupComplete).toBe(true)
  })
})
