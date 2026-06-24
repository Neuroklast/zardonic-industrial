import { describe, expect, it } from 'vitest'
import { buildGigIcsContent, escapeIcsText, formatIcsUtcDate, getGigIcsFilename } from '@/lib/gig-ics'
import type { Gig } from '@/lib/app-types'

const sampleGig: Gig = {
  id: 'gig-abc',
  title: 'Festival Night',
  venue: 'Club Matrix',
  location: 'Berlin, Germany',
  date: '2026-08-01T20:00:00Z',
  ticketUrl: 'https://tickets.example.com/gig',
  description: 'Doors open early.',
}

describe('gig-ics', () => {
  it('formats UTC iCalendar timestamps', () => {
    expect(formatIcsUtcDate(new Date('2026-08-01T20:00:00Z'))).toBe('20260801T200000Z')
  })

  it('escapes iCalendar text values', () => {
    expect(escapeIcsText('Line one\nLine; two, three')).toBe('Line one\\nLine\\; two\\, three')
  })

  it('builds a valid VEVENT block', () => {
    const content = buildGigIcsContent(sampleGig, 'ZARDONIC')

    expect(content).toContain('BEGIN:VCALENDAR')
    expect(content).toContain('BEGIN:VEVENT')
    expect(content).toContain('UID:gig-abc@zardonic')
    expect(content).toContain('SUMMARY:ZARDONIC @ Club Matrix')
    expect(content).toContain('LOCATION:Berlin\\, Germany')
    expect(content).toContain('URL:https://tickets.example.com/gig')
    expect(content).toContain('END:VEVENT')
    expect(content).toContain('END:VCALENDAR')
  })

  it('creates a readable ics filename', () => {
    expect(getGigIcsFilename(sampleGig)).toBe('club-matrix-2026-08-01.ics')
  })
})