import { describe, expect, it } from 'vitest'
import { browseGigs } from '@/lib/gig-browse'
import type { PublicGigRow } from '@/lib/gig-public-mapper'

describe('gig browse helpers', () => {
  const gigs: PublicGigRow[] = [
    {
      id: 'past',
      title: 'Old Show',
      venue: 'Arena',
      city: 'Berlin',
      country: 'Germany',
      event_date: '2020-01-01',
      ticket_url: null,
      festival_name: null,
    },
    {
      id: 'upcoming',
      title: 'Future Fest',
      venue: 'Main Stage',
      city: 'Paris',
      country: 'France',
      event_date: '2030-06-01',
      ticket_url: null,
      festival_name: 'Future Fest',
    },
  ]

  const now = new Date('2026-01-01')

  it('filters upcoming and past gigs', () => {
    const upcoming = browseGigs(gigs, { timingFilter: 'upcoming', now })
    expect(upcoming.map((gig) => gig.id)).toEqual(['upcoming'])

    const past = browseGigs(gigs, { timingFilter: 'past', now })
    expect(past.map((gig) => gig.id)).toEqual(['past'])
  })

  it('searches by venue and city', () => {
    const results = browseGigs(gigs, { query: 'berlin', now })
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe('past')
  })
})