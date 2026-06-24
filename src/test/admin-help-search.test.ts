import { describe, expect, it } from 'vitest'
import { ADMIN_NAV_ITEMS } from '@/app/admin/_config/nav-groups'
import { ADMIN_HELP_INDEX } from '@/lib/admin-help-index'
import {
  ADMIN_HELP_BROWSE_LIMIT,
  groupAdminHelpResults,
  searchAdminHelp,
} from '@/lib/admin-help-search'

describe('ADMIN_HELP_INDEX integrity', () => {
  it('has unique entry ids', () => {
    const ids = ADMIN_HELP_INDEX.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers every admin nav route', () => {
    for (const item of ADMIN_NAV_ITEMS) {
      const match = ADMIN_HELP_INDEX.find((e) => e.href === item.href)
      expect(match, `missing help entry for ${item.href}`).toBeTruthy()
    }
  })

  it('includes all look-and-feel sub-tabs', () => {
    const tabIds = ['theme', 'background', 'hero', 'sections', 'text', 'advanced']
    for (const tab of tabIds) {
      expect(
        ADMIN_HELP_INDEX.some((e) => e.href === `/admin/site-config?tab=${tab}`)
      ).toBe(true)
    }
  })
})

describe('searchAdminHelp', () => {
  it('returns priority-sorted browse list capped for empty query', () => {
    const results = searchAdminHelp('')
    expect(results.length).toBe(ADMIN_HELP_BROWSE_LIMIT)
    expect(results.length).toBeLessThan(ADMIN_HELP_INDEX.length)
    expect(results[0]?.entry.id).toBe('help-search')
  })

  it('returns full index when searching', () => {
    const results = searchAdminHelp('dashboard overview')
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(ADMIN_HELP_INDEX.length)
  })

  it('finds hero wordmark help by natural language query', () => {
    const results = searchAdminHelp('wordmark logo hero')
    const ids = results.map((r) => r.entry.id)
    expect(ids).toContain('help-hero-wordmark')
    expect(ids).toContain('site-config-hero')
  })

  it('finds legal and privacy topics', () => {
    const results = searchAdminHelp('datenschutz gdpr privacy')
    const ids = results.map((r) => r.entry.id)
    expect(ids).toContain('help-legal')
    expect(ids.some((id) => id.includes('legal'))).toBe(true)
  })

  it('finds catalogue sync by platform name', () => {
    const results = searchAdminHelp('spotify sync import')
    const ids = results.map((r) => r.entry.id)
    expect(ids).toContain('help-release-sync')
    expect(ids.some((id) => id.includes('releases-sync'))).toBe(true)
  })

  it('returns empty for nonsense query', () => {
    const results = searchAdminHelp('xyzzyplughnotfound')
    expect(results).toEqual([])
  })
})

describe('groupAdminHelpResults', () => {
  it('groups results and preserves group order', () => {
    const results = searchAdminHelp('hero')
    const grouped = groupAdminHelpResults(results, ['Help', 'Look & Feel', 'Content'])
    expect(grouped.length).toBeGreaterThan(0)
    const groups = grouped.map((g) => g.group)
    const helpIdx = groups.indexOf('Help')
    const lookIdx = groups.indexOf('Look & Feel')
    if (helpIdx >= 0 && lookIdx >= 0) {
      expect(helpIdx).toBeLessThan(lookIdx)
    }
  })
})