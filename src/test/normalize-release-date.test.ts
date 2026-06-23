import { describe, expect, it } from 'vitest'
import { normalizeReleaseDateForDb } from '@/lib/normalize-release-date'

describe('normalizeReleaseDateForDb', () => {
  it('returns null for empty input', () => {
    expect(normalizeReleaseDateForDb(null)).toBeNull()
    expect(normalizeReleaseDateForDb('')).toBeNull()
    expect(normalizeReleaseDateForDb('   ')).toBeNull()
  })

  it('passes through full ISO dates', () => {
    expect(normalizeReleaseDateForDb('2024-06-15')).toBe('2024-06-15')
    expect(normalizeReleaseDateForDb('2024-06-15T12:00:00Z')).toBe('2024-06-15')
  })

  it('normalizes year-month to first of month', () => {
    expect(normalizeReleaseDateForDb('2026-03')).toBe('2026-03-01')
  })

  it('normalizes year-only to Jan 1', () => {
    expect(normalizeReleaseDateForDb('2026')).toBe('2026-01-01')
    expect(normalizeReleaseDateForDb('2008')).toBe('2008-01-01')
  })

  it('returns null for invalid strings', () => {
    expect(normalizeReleaseDateForDb('unknown')).toBeNull()
    expect(normalizeReleaseDateForDb('20')).toBeNull()
  })
})