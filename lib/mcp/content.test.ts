import { describe, expect, it } from 'vitest'
import { allowedContentFields, digestContent, getContentDefinition, parseContentChanges } from './content'
import { mergeSiteContent, parseSiteContentPatch } from './site-config'

describe('MCP editorial allowlist', () => {
  it('does not expose private tables or arbitrary fields', () => {
    expect(getContentDefinition('plugin_orders')).toBeNull()
    expect(getContentDefinition('api_secrets')).toBeNull()
    expect(getContentDefinition('profiles')).toBeNull()
    expect(allowedContentFields('news_posts')).not.toContain('created_at')
    expect(() => parseContentChanges('news_posts', 'update', { password: 'secret' })).toThrow('not writable')
    expect(() => parseContentChanges('soundpacks', 'update', { price_cents: 0 })).toThrow('not writable')
    expect(() => parseContentChanges('soundpacks', 'update', { archive_key: 'private.zip' })).toThrow('not writable')
  })

  it('keeps news and gig proposals as drafts even if publication is requested', () => {
    expect(parseContentChanges('news_posts', 'create', {
      title: 'Next release', slug: 'next-release', active: true, body: 'A new single',
    }).active).toBe(false)
    expect(parseContentChanges('gigs', 'create', {
      title: 'Concert', event_date: '2027-01-01T20:00:00+01:00',
    }).active).toBe(false)
  })

  it('keeps every new record unpublished until an administrator publishes it', () => {
    expect(parseContentChanges('releases', 'create', {
      title: 'Empyrean Remix', type: 'remix', active: false, artists: ['Zardonic'],
    }).active).toBe(false)
    expect(parseContentChanges('releases', 'create', { title: 'New release', type: 'ep' }).active).toBe(false)
    expect(parseContentChanges('releases', 'update', { title: 'Corrected title' })).not.toHaveProperty('active')
    expect(parseContentChanges('releases', 'update', { active: false }).active).toBe(false)
    expect(parseContentChanges('news_posts', 'create', { title: 'Draft', slug: 'draft', active: true }).active).toBe(false)
  })

  it('rejects incomplete records, wrong URLs, bad IDs and forbidden creation', () => {
    expect(() => parseContentChanges('gigs', 'create', { title: 'Concert' })).toThrow('Required field')
    expect(() => parseContentChanges('news_posts', 'create', { title: 'News', slug: '../bad' })).toThrow('Invalid slug')
    expect(() => parseContentChanges('news_posts', 'update', { cover_url: 'javascript:alert(1)' })).toThrow('Invalid cover_url')
    expect(() => parseContentChanges('gallery', 'create', { caption: 'new' })).toThrow('Creation is not supported')
    expect(() => parseContentChanges('releases', 'update', { itunes_id: '123' })).toThrow('not writable')
    expect(() => parseContentChanges('releases', 'update', { streaming_links: [{ platform: 'Spotify', url: 'javascript:alert(1)' }] })).toThrow('Invalid streaming_links')
    expect(() => parseContentChanges('gigs', 'update', { ticket_url: 'javascript:alert(1)' })).toThrow('Invalid ticket_url')
    expect(() => parseContentChanges('soundpacks', 'update', { external_url: 'javascript:alert(1)' })).toThrow('Invalid external_url')
  })

  it('versions content for conflict detection', () => {
    expect(digestContent({ id: '1', title: 'A' })).toBe(digestContent({ id: '1', title: 'A' }))
    expect(digestContent({ id: '1', title: 'A' })).not.toBe(digestContent({ id: '1', title: 'B' }))
  })
})

describe('MCP public site copy', () => {
  it('accepts only allowlisted fields and keys', () => {
    expect(parseSiteContentPatch('hero', { headline: 'ZARDONIC' })).toEqual({ headline: 'ZARDONIC' })
    expect(() => parseSiteContentPatch('legal', { operatorName: 'X' })).toThrow('read-only')
    expect(() => parseSiteContentPatch('hero', { trackingId: 'xx' })).toThrow()
    expect(() => parseSiteContentPatch('merchandise', { footerUrl: '//evil.example' })).toThrow()
    expect(() => parseSiteContentPatch('sections', { sections: [] })).toThrow('read-only')
  })

  it('merges translations without deleting existing locales', () => {
    const prev = { 'hero.cta': { de: 'Anhören', en: 'Listen' } }
    const patch = parseSiteContentPatch('translations', { 'hero.cta': { de: 'Jetzt anhören' } })
    expect(mergeSiteContent('translations', prev, patch)).toEqual({
      'hero.cta': { de: 'Jetzt anhören', en: 'Listen' },
    })
  })

  it('rejects prototype-related translation keys', () => {
    expect(() => parseSiteContentPatch('translations', {
      constructor: { en: 'not allowed' },
    })).toThrow()
  })
})
