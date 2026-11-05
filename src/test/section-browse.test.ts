import { describe, expect, it } from 'vitest'
import { browseSectionItems } from '@/lib/section-browse'
import { paginateItems } from '@/lib/browse-pagination'
import {
  DEFAULT_SECTIONS,
  parseSections,
  sectionItemLimit,
} from '@/lib/site-config-sections'

describe('homepage section configuration', () => {
  it('keeps existing order and visibility while reading item limits', () => {
    const saved = [
      { id: 'soundpacks', label: 'My packs', visible: false, order: 0, maxItems: 5 },
      { id: 'music-highlights', label: 'Music', visible: true, order: 1, maxItems: 2 },
    ]
    const sections = parseSections(saved)
    const packs = sections.find((section) => section.id === 'soundpacks')!
    expect(packs.visible).toBe(false)
    expect(packs.order).toBe(0)
    expect(packs.label).toBe('My packs')
    expect(sectionItemLimit(packs)).toBe(5)
    expect(sectionItemLimit(sections.find((s) => s.id === 'music-highlights')!)).toBe(2)
    expect(sections.length).toBe(DEFAULT_SECTIONS.length)
  })

  it('uses safe defaults for legacy, invalid and extreme counts', () => {
    expect(sectionItemLimit(parseSections(null).find((s) => s.id === 'soundpacks')!)).toBe(8)
    expect(sectionItemLimit(parseSections([{ id: 'soundpacks', label: '', visible: true, order: 0, maxItems: 200 }])[0])).toBe(8)
    expect(sectionItemLimit(parseSections([{ id: 'music-highlights', label: '', visible: true, order: 0, maxItems: -1 }])[0])).toBe(4)
    expect(sectionItemLimit(parseSections([{ id: 'music-highlights', label: '', visible: true, order: 0, maxItems: 3.5 }])[0])).toBe(4)
  })
})

describe('catalogue browsing', () => {
  const items = [
    { title: 'Zebra', description: 'Studio footage' },
    { title: 'Alpha', description: 'Behind the scenes' },
    { title: 'Beta', description: null },
  ]

  it('matches titles and descriptions, case-insensitively', () => {
    expect(browseSectionItems(items, 'ALP', 'editorial').map((i) => i.title)).toEqual(['Alpha'])
    expect(browseSectionItems(items, 'STUDIO', 'editorial').map((i) => i.title)).toEqual(['Zebra'])
  })

  it('keeps manual order by default and supports both title sort directions', () => {
    expect(browseSectionItems(items, '', 'editorial').map((i) => i.title)).toEqual(['Zebra', 'Alpha', 'Beta'])
    expect(browseSectionItems(items, '', 'title-asc').map((i) => i.title)).toEqual(['Alpha', 'Beta', 'Zebra'])
    expect(browseSectionItems(items, '', 'title-desc').map((i) => i.title)).toEqual(['Zebra', 'Beta', 'Alpha'])
    expect(items[0].title).toBe('Zebra')
  })

  it('paginates filtered collections without losing total count', () => {
    const filtered = browseSectionItems(items, '', 'title-asc')
    const page = paginateItems(filtered, 2, 2)
    expect(page.items.map((item) => item.title)).toEqual(['Zebra'])
    expect(page.totalItems).toBe(3)
    expect(page.totalPages).toBe(2)
  })
})
