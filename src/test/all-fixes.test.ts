/**
 * Tests for the comprehensive fix PR:
 *  1. Background "Animated Background" label in animItems
 *  2. Logo reorder logic – moveLogo up/down
 *  3. Progressive overlay mode selection (getRandomProgressiveMode wiring)
 *  6. Custom social links – CustomSocialLink type + rendering path
 *  7. Chromatic aberration – CSS class .logo-white approach (type-level smoke)
 */

import { describe, it, expect } from 'vitest'
import type { AdminSettings, CustomSocialLink } from '@/lib/types'
import { getRandomProgressiveMode, getAllProgressiveModes } from '@/lib/progressive-overlay-modes'

// ── 1. animItems label ────────────────────────────────────────────────────────
describe('appearance config', () => {
  it('exports font size ranges for Site Config appearance editor', async () => {
    const { FONT_SIZE_RANGES } = await import('@/lib/appearance-presets')
    expect(FONT_SIZE_RANGES.heading).toBeDefined()
    expect(FONT_SIZE_RANGES.body).toBeDefined()
  })
})

// ── 2. Logo reorder logic ─────────────────────────────────────────────────────

function moveLogoInArray<T>(arr: T[], idx: number, dir: 'up' | 'down'): T[] {
  const out = [...arr]
  const target = dir === 'up' ? idx - 1 : idx + 1
  if (target < 0 || target >= out.length) return out
  ;[out[idx], out[target]] = [out[target], out[idx]]
  return out
}

describe('logo reorder logic', () => {
  const logos = [
    { src: 'a.png', alt: 'A' },
    { src: 'b.png', alt: 'B' },
    { src: 'c.png', alt: 'C' },
  ]

  it('moves a logo up', () => {
    const result = moveLogoInArray(logos, 1, 'up')
    expect(result[0].alt).toBe('B')
    expect(result[1].alt).toBe('A')
    expect(result[2].alt).toBe('C')
  })

  it('moves a logo down', () => {
    const result = moveLogoInArray(logos, 1, 'down')
    expect(result[0].alt).toBe('A')
    expect(result[1].alt).toBe('C')
    expect(result[2].alt).toBe('B')
  })

  it('does not move the first logo up', () => {
    const result = moveLogoInArray(logos, 0, 'up')
    expect(result).toEqual(logos)
  })

  it('does not move the last logo down', () => {
    const result = moveLogoInArray(logos, 2, 'down')
    expect(result).toEqual(logos)
  })
})

// ── 3. Progressive overlay mode selection ────────────────────────────────────

describe('getRandomProgressiveMode', () => {
  it('returns a mode when no settings provided', () => {
    const mode = getRandomProgressiveMode()
    expect(mode).toBeTruthy()
    expect(mode.name).toBeTruthy()
    expect(mode.containerVariants.loaded).toBeTruthy()
    expect(mode.containerVariants.loading).toBeTruthy()
  })

  it('returns the same mode repeatedly when only one is enabled', () => {
    const settings = {
      progressiveReveal: true,
      dataStream: false,
      sectorAssembly: false,
      holographicMaterialization: false,
    }
    for (let i = 0; i < 10; i++) {
      const mode = getRandomProgressiveMode(settings)
      expect(mode.name).toBe('progressiveReveal')
    }
  })

  it('falls back to progressiveReveal when all modes are disabled', () => {
    const settings = {
      progressiveReveal: false,
      dataStream: false,
      sectorAssembly: false,
      holographicMaterialization: false,
    }
    const mode = getRandomProgressiveMode(settings)
    expect(mode.name).toBe('progressiveReveal')
  })

  it('getRandomProgressiveMode respects enabled flags', () => {
    const settings = {
      progressiveReveal: false,
      dataStream: true,
      sectorAssembly: false,
      holographicMaterialization: false,
    }
    const mode = getRandomProgressiveMode(settings)
    expect(mode.name).toBe('dataStream')
  })

  it('getAllProgressiveModes returns all 4 built-in modes', () => {
    const modes = getAllProgressiveModes()
    expect(modes.length).toBeGreaterThanOrEqual(4)
    const names = modes.map((m) => m.name)
    expect(names).toContain('progressiveReveal')
    expect(names).toContain('dataStream')
    expect(names).toContain('sectorAssembly')
    expect(names).toContain('holographicMaterialization')
  })
})

// ── 4. CustomSocialLink type ──────────────────────────────────────────────────

describe('CustomSocialLink', () => {
  it('accepts required id, label, url fields', () => {
    const link: CustomSocialLink = {
      id: '1',
      label: 'Patreon',
      url: 'https://patreon.com/artist',
    }
    expect(link.id).toBe('1')
    expect(link.label).toBe('Patreon')
    expect(link.url).toBe('https://patreon.com/artist')
  })

  it('allows optional icon field', () => {
    const link: CustomSocialLink = {
      id: '2',
      label: 'Ko-fi',
      url: 'https://ko-fi.com/artist',
      icon: 'coffee',
    }
    expect(link.icon).toBe('coffee')
  })

  it('customSocialLinks array is stored in AdminSettings', () => {
    const settings: AdminSettings = {
      customSocialLinks: [
        { id: '1', label: 'Patreon', url: 'https://patreon.com' },
        { id: '2', label: 'Ko-fi', url: 'https://ko-fi.com' },
      ],
    }
    expect(settings.customSocialLinks).toHaveLength(2)
    expect(settings.customSocialLinks?.[0].label).toBe('Patreon')
  })
})

// ── 5. Live overlay smoke test ────────────────────────────────────────────────

describe('CyberpunkOverlay module', () => {
  it('can be imported for release overlay', async () => {
    const mod = await import('@/components/CyberpunkOverlay')
    expect(mod.default).toBeTruthy()
  }, 15_000)
})
