import { describe, expect, it } from 'vitest'
import { formatIsoDateCompact, formatIsoDateLong, parseIsoDateParts } from '@/lib/format-display-date'

describe('format-display-date', () => {
  it('parses date-only ISO strings without local timezone drift', () => {
    expect(parseIsoDateParts('2026-06-15')).toEqual({ year: 2026, month: 6, day: 15 })
  })

  it('formats compact gig labels deterministically', () => {
    expect(formatIsoDateCompact('2026-06-15')).toBe('15062026')
  })

  it('formats long display dates in UTC', () => {
    expect(formatIsoDateLong('2026-06-15')).toBe('Mon, Jun 15, 2026')
  })
})