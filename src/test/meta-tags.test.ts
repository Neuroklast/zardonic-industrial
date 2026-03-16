import { describe, it, expect, beforeEach } from 'vitest'
import { generateMetaTags, applyMetaTags } from '@/lib/meta-tags'
import type { SiteConfig, MetaTagSet } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fullConfig(): Partial<SiteConfig> {
  return {
    siteName: 'Zardonic',
    description: 'Venezuelan DnB / Metal artist',
    tagline: 'Industrial Bass Music',
    domain: 'https://zardonic.industrial',
    logoUrl: 'https://zardonic.industrial/logo.png',
    genres: ['DnB', 'Metal'],
    socialLinks: {
      instagram: 'https://instagram.com/zardonic',
      youtube: 'https://youtube.com/zardonic',
      spotify: 'https://open.spotify.com/artist/zardonic',
    },
    seo: {
      title: 'Zardonic Official',
      ogImage: 'https://zardonic.industrial/og.jpg',
      twitterCard: 'summary',
      twitterHandle: '@zardonic',
    },
    themeSettings: {
      background: '#0a0a0a',
    },
  }
}

// ---------------------------------------------------------------------------
describe('generateMetaTags()', () => {
  it('generates meta tags with full config', () => {
    const config = fullConfig() as SiteConfig
    const tags = generateMetaTags(config)

    expect(tags.title).toBe('Zardonic Official')
    expect(tags.description).toBe('Venezuelan DnB / Metal artist')
    expect(tags.canonical).toBe('https://zardonic.industrial')
    expect(tags.favicon).toBe('https://zardonic.industrial/logo.png')
    expect(tags.themeColor).toBe('#0a0a0a')

    // OG tags
    expect(tags.og.title).toBe('Zardonic Official')
    expect(tags.og.description).toBe('Venezuelan DnB / Metal artist')
    expect(tags.og.type).toBe('website')
    expect(tags.og.image).toBe('https://zardonic.industrial/og.jpg')
    expect(tags.og.siteName).toBe('Zardonic')

    // Twitter tags
    expect(tags.twitter.card).toBe('summary')
    expect(tags.twitter.site).toBe('@zardonic')
    expect(tags.twitter.image).toBe('https://zardonic.industrial/og.jpg')
  })

  it('uses default values when config is mostly empty', () => {
    const tags = generateMetaTags({} as SiteConfig)

    expect(tags.title).toBe('Artist Site')
    expect(tags.description).toBe('A music artist website')
    expect(tags.canonical).toBeUndefined()
    expect(tags.themeColor).toBe('#000000')
    expect(tags.og.type).toBe('website')
    expect(tags.twitter.card).toBe('summary_large_image')
  })

  it('falls back to tagline for description', () => {
    const config = { tagline: 'My tagline text' } as SiteConfig
    const tags = generateMetaTags(config)
    expect(tags.description).toBe('My tagline text')
  })

  it('builds title from siteName and tagline when no seo.title', () => {
    const config = { siteName: 'TestBand', tagline: 'We rock' } as SiteConfig
    const tags = generateMetaTags(config)
    expect(tags.title).toBe('TestBand – We rock')
  })

  it('generates JSON-LD with MusicGroup schema', () => {
    const config = fullConfig() as SiteConfig
    const tags = generateMetaTags(config)
    const jsonLd = JSON.parse(tags.jsonLd!)

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('MusicGroup')
    expect(jsonLd.name).toBe('Zardonic')
    expect(jsonLd.genre).toEqual(['DnB', 'Metal'])
    expect(jsonLd.sameAs).toContain('https://instagram.com/zardonic')
    expect(jsonLd.sameAs).toContain('https://youtube.com/zardonic')
  })
})

// ---------------------------------------------------------------------------
describe('applyMetaTags()', () => {
  beforeEach(() => {
    // Clean head before each test
    document.head.innerHTML = ''
    document.title = ''
  })

  it('sets document.title', () => {
    const tags = generateMetaTags(fullConfig() as SiteConfig)
    applyMetaTags(tags)
    expect(document.title).toBe('Zardonic Official')
  })

  it('creates meta description element', () => {
    const tags = generateMetaTags(fullConfig() as SiteConfig)
    applyMetaTags(tags)
    const el = document.querySelector('meta[name="description"]')
    expect(el).not.toBeNull()
    expect(el!.getAttribute('content')).toBe('Venezuelan DnB / Metal artist')
  })

  it('creates OG meta elements', () => {
    const tags = generateMetaTags(fullConfig() as SiteConfig)
    applyMetaTags(tags)
    const ogTitle = document.querySelector('meta[property="og:title"]')
    expect(ogTitle).not.toBeNull()
    expect(ogTitle!.getAttribute('content')).toBe('Zardonic Official')
  })

  it('creates JSON-LD script element', () => {
    const tags = generateMetaTags(fullConfig() as SiteConfig)
    applyMetaTags(tags)
    const script = document.getElementById('json-ld-main')
    expect(script).not.toBeNull()
    expect(script!.getAttribute('type')).toBe('application/ld+json')
    expect(script!.textContent).toContain('MusicGroup')
  })

  it('creates canonical link element', () => {
    const tags = generateMetaTags(fullConfig() as SiteConfig)
    applyMetaTags(tags)
    const link = document.querySelector('link[rel="canonical"]')
    expect(link).not.toBeNull()
    expect(link!.getAttribute('href')).toBe('https://zardonic.industrial')
  })
})
