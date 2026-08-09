import { describe, expect, it } from 'vitest'
import { NAV_ICON_SECTION_IDS, getNavIcon, NAV_ICONS } from '@/lib/nav-icons'
import { SECTION_ANCHOR_BY_ID } from '@/lib/nav-links'

describe('nav icons', () => {
  it('maps an icon for every public nav section id', () => {
    for (const id of Object.keys(SECTION_ANCHOR_BY_ID)) {
      expect(NAV_ICONS[id], `missing icon for ${id}`).toBeDefined()
      expect(getNavIcon(id)).toBe(NAV_ICONS[id])
    }
  })

  it('includes bio so it cannot silently vanish from the icon map', () => {
    expect(NAV_ICON_SECTION_IDS).toContain('bio')
    expect(getNavIcon('bio')).toBeDefined()
  })

  it('falls back for unknown section ids', () => {
    expect(getNavIcon('not-a-real-section')).toBeDefined()
  })
})
