import { describe, expect, it } from 'vitest'
import { formatSectionHeading, resolveSectionHeading } from '@/lib/section-display'

describe('resolveSectionHeading', () => {
  const t = (key: string) => {
    if (key === 'section.bio') return 'Biografie'
    if (key === 'section.gigs') return 'Tourdaten'
    return key
  }

  it('translates empty / default English labels', () => {
    expect(resolveSectionHeading(undefined, 'bio', t)).toBe('BIOGRAFIE')
    expect(resolveSectionHeading('Biography', 'bio', t)).toBe('BIOGRAFIE')
    expect(resolveSectionHeading('  biography  ', 'bio', t)).toBe('BIOGRAFIE')
  })

  it('keeps custom admin labels', () => {
    expect(resolveSectionHeading('Our Story', 'bio', t)).toBe('OUR STORY')
  })

  it('formatSectionHeading stays English for drafts/SSR helpers', () => {
    expect(formatSectionHeading(undefined, 'bio')).toBe('BIOGRAPHY')
  })

  it('uses locale casing so ß / i-dot do not break headings', () => {
    const tDe = (key: string) => (key === 'section.bio' ? 'Biografie' : key)
    expect(resolveSectionHeading(undefined, 'bio', tDe, 'de')).toBe('BIOGRAFIE')
    const tJa = (key: string) => (key === 'section.bio' ? '経歴' : key)
    expect(resolveSectionHeading(undefined, 'bio', tJa, 'ja')).toBe('経歴')
  })
})
