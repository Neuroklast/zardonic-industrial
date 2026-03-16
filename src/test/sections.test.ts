import { describe, it, expect } from 'vitest'
import {
  buildDefaultSections,
  normalizeSections,
  resolveSections,
  toggleSection,
  reorderSections,
  migrateSectionOrder,
  getEnabledSections,
  ALL_SECTION_IDS,
} from '@/lib/sections'
import { DEFAULT_SECTION_ORDER } from '@/lib/site-config'
import type { SectionConfig } from '@/lib/types'

// ---------------------------------------------------------------------------
describe('buildDefaultSections()', () => {
  it('returns all section IDs from DEFAULT_SECTION_ORDER', () => {
    const sections = buildDefaultSections()
    const ids = sections.map((s) => s.id)
    expect(ids).toEqual(DEFAULT_SECTION_ORDER)
  })

  it('all sections are enabled by default', () => {
    const sections = buildDefaultSections()
    expect(sections.every((s) => s.enabled)).toBe(true)
  })

  it('assigns sequential order indices', () => {
    const sections = buildDefaultSections()
    sections.forEach((s, i) => expect(s.order).toBe(i))
  })
})

// ---------------------------------------------------------------------------
describe('normalizeSections()', () => {
  it('fills missing sections that are in ALL_SECTION_IDS', () => {
    const partial: SectionConfig[] = [{ id: 'news', enabled: true, order: 0 }]
    const result = normalizeSections(partial)
    const ids = result.map((s) => s.id)
    for (const id of ALL_SECTION_IDS) {
      expect(ids).toContain(id)
    }
  })

  it('preserves existing configs', () => {
    const partial: SectionConfig[] = [
      { id: 'news', enabled: false, order: 5 },
    ]
    const result = normalizeSections(partial)
    const news = result.find((s) => s.id === 'news')!
    expect(news.enabled).toBe(false)
    expect(news.order).toBe(5)
  })

  it('sorts output by order', () => {
    const configs: SectionConfig[] = [
      { id: 'contact', enabled: true, order: 0 },
      { id: 'news', enabled: true, order: 1 },
    ]
    const result = normalizeSections(configs)
    expect(result[0].id).toBe('contact')
    expect(result[1].id).toBe('news')
  })
})

// ---------------------------------------------------------------------------
describe('resolveSections()', () => {
  it('uses sections when provided', () => {
    const sections: SectionConfig[] = [
      { id: 'news', enabled: true, order: 0 },
      { id: 'gallery', enabled: false, order: 1 },
    ]
    const result = resolveSections({ sections })
    expect(result.find((s) => s.id === 'news')).toBeDefined()
    expect(result.find((s) => s.id === 'gallery')!.enabled).toBe(false)
  })

  it('migrates from sectionOrder when no sections present', () => {
    const result = resolveSections({ sectionOrder: ['gallery', 'contact'] })
    expect(result[0].id).toBe('gallery')
    expect(result[1].id).toBe('contact')
    expect(result.every((s) => s.enabled)).toBe(true)
  })

  it('returns defaults when both are empty', () => {
    const result = resolveSections({})
    const ids = result.map((s) => s.id)
    expect(ids).toEqual(DEFAULT_SECTION_ORDER)
  })
})

// ---------------------------------------------------------------------------
describe('toggleSection()', () => {
  it('flips enabled state of the target section', () => {
    const sections = buildDefaultSections()
    const toggled = toggleSection(sections, 'news')
    const news = toggled.find((s) => s.id === 'news')!
    expect(news.enabled).toBe(false)
  })

  it('does not affect other sections', () => {
    const sections = buildDefaultSections()
    const toggled = toggleSection(sections, 'news')
    const gallery = toggled.find((s) => s.id === 'gallery')!
    expect(gallery.enabled).toBe(true)
  })

  it('toggles back when called again', () => {
    const sections = buildDefaultSections()
    const once = toggleSection(sections, 'news')
    const twice = toggleSection(once, 'news')
    expect(twice.find((s) => s.id === 'news')!.enabled).toBe(true)
  })
})

// ---------------------------------------------------------------------------
describe('reorderSections()', () => {
  it('moves section to a new position', () => {
    const sections = buildDefaultSections()
    const reordered = reorderSections(sections, 'contact', 0)
    expect(reordered[0].id).toBe('contact')
  })

  it('reassigns sequential order values', () => {
    const sections = buildDefaultSections()
    const reordered = reorderSections(sections, 'contact', 0)
    reordered.forEach((s, i) => expect(s.order).toBe(i))
  })

  it('returns unchanged when section is not found', () => {
    const sections = buildDefaultSections()
    const result = reorderSections(sections, 'nonexistent', 0)
    expect(result.map((s) => s.id)).toEqual(sections.map((s) => s.id))
  })
})

// ---------------------------------------------------------------------------
describe('migrateSectionOrder()', () => {
  it('converts legacy string[] to SectionConfig[]', () => {
    const result = migrateSectionOrder(['news', 'gallery', 'gigs'])
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ id: 'news', enabled: true, order: 0 })
    expect(result[1]).toEqual({ id: 'gallery', enabled: true, order: 1 })
    expect(result[2]).toEqual({ id: 'gigs', enabled: true, order: 2 })
  })
})

// ---------------------------------------------------------------------------
describe('getEnabledSections()', () => {
  it('returns only enabled sections, sorted by order', () => {
    const sections: SectionConfig[] = [
      { id: 'news', enabled: true, order: 2 },
      { id: 'gallery', enabled: false, order: 0 },
      { id: 'gigs', enabled: true, order: 1 },
    ]
    const result = getEnabledSections(sections)
    const enabledIds = result.map((s) => s.id)
    expect(enabledIds).not.toContain('gallery')
    expect(enabledIds).toContain('news')
    expect(enabledIds).toContain('gigs')
    // gigs (order 1) should come before news (order 2)
    expect(enabledIds.indexOf('gigs')).toBeLessThan(enabledIds.indexOf('news'))
  })
})
