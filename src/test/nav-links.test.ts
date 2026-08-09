import { describe, expect, it } from 'vitest'
import { buildNavLinks } from '@/lib/nav-links'
import type { SectionConfig } from '@/lib/site-config-sections'

function section(id: string, order: number, visible = true, label = ''): SectionConfig {
  return { id, label, visible, order }
}

describe('buildNavLinks', () => {
  it('orders links by section order', () => {
    const links = buildNavLinks([
      section('releases', 2),
      section('bio', 0),
      section('gallery', 1),
    ])
    expect(links.map((link) => link.sectionId)).toEqual(['bio', 'gallery', 'releases'])
  })

  it('maps config ids to public anchor hrefs', () => {
    const links = buildNavLinks([section('music-highlights', 0), section('merchandise', 1)])
    expect(links[0].href).toBe('#music')
    expect(links[1].href).toBe('#merch')
  })

  it('excludes hero and hidden sections', () => {
    const links = buildNavLinks([
      section('hero', 0),
      section('bio', 1, false),
      section('contact', 2),
    ])
    expect(links.map((link) => link.sectionId)).toEqual(['contact'])
  })

  it('uses compact default nav labels (full section titles stay on page headings)', () => {
    const links = buildNavLinks([
      { id: 'gigs', label: 'Tour Dates & Live Shows', visible: true, order: 0 },
      { id: 'bio', label: 'Biography', visible: true, order: 1 },
      { id: 'releases', label: 'Discography', visible: true, order: 2 },
    ])
    expect(links[0].label).toBe('Events')
    expect(links[1].label).toBe('Bio')
    expect(links[2].label).toBe('Releases')
  })
})