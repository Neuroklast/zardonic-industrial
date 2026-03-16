import { describe, it, expect } from 'vitest'
import {
  WIDGET_CATALOG,
  createWidgetRegistry,
} from '@/lib/widget-registry'

// ---------------------------------------------------------------------------
describe('WIDGET_CATALOG', () => {
  it('contains expected widget IDs', () => {
    const ids = WIDGET_CATALOG.map((w) => w.id)
    expect(ids).toContain('bandsintown')
    expect(ids).toContain('youtube')
    expect(ids).toContain('spotify-player')
    expect(ids).toContain('merch-store')
    expect(ids).toContain('analytics')
  })

  it('all widgets have required fields', () => {
    for (const w of WIDGET_CATALOG) {
      expect(w.id).toBeTruthy()
      expect(w.name).toBeTruthy()
      expect(w.version).toBeTruthy()
      expect(w.category).toBeTruthy()
      expect(w.licenseStatus).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
describe('createWidgetRegistry()', () => {
  it('creates registry with no unlocked IDs', () => {
    const reg = createWidgetRegistry()
    expect(reg.widgets).toBe(WIDGET_CATALOG)
  })

  describe('getWidget()', () => {
    it('returns correct widget definition by ID', () => {
      const reg = createWidgetRegistry()
      const w = reg.getWidget('youtube')
      expect(w).toBeDefined()
      expect(w!.name).toBe('YouTube Player')
    })

    it('returns undefined for unknown ID', () => {
      const reg = createWidgetRegistry()
      expect(reg.getWidget('nonexistent')).toBeUndefined()
    })
  })

  describe('getLicenseStatus()', () => {
    it('returns "free" for free widgets', () => {
      const reg = createWidgetRegistry()
      expect(reg.getLicenseStatus('bandsintown')).toBe('free')
      expect(reg.getLicenseStatus('youtube')).toBe('free')
    })

    it('returns "locked" for unknown widget IDs', () => {
      const reg = createWidgetRegistry()
      expect(reg.getLicenseStatus('unknown-widget')).toBe('locked')
    })
  })

  describe('isUnlocked()', () => {
    it('returns true for free widgets without explicit unlock', () => {
      const reg = createWidgetRegistry()
      expect(reg.isUnlocked('bandsintown')).toBe(true)
      expect(reg.isUnlocked('spotify-player')).toBe(true)
    })

    it('returns false for unknown widget IDs', () => {
      const reg = createWidgetRegistry()
      expect(reg.isUnlocked('nonexistent')).toBe(false)
    })

    it('returns true for explicitly unlocked IDs', () => {
      const reg = createWidgetRegistry(['analytics'])
      expect(reg.isUnlocked('analytics')).toBe(true)
    })
  })
})
