import { describe, expect, it } from 'vitest'
import { mapGigRowToOverlayGig } from '@/lib/gig-public-mapper'

describe('mapGigRowToOverlayGig', () => {
  it('maps location, venue, and ticket url for the overlay', () => {
    const gig = mapGigRowToOverlayGig({
      id: 'gig-1',
      title: 'Live Show',
      venue: 'Club X',
      city: 'Berlin',
      country: 'Germany',
      event_date: '2026-08-01T20:00:00Z',
      ticket_url: 'https://tickets.example.com/1',
      festival_name: 'Festival X',
      description: 'Industrial night.',
    })

    expect(gig.id).toBe('gig-1')
    expect(gig.title).toBe('Festival X')
    expect(gig.venue).toBe('Club X')
    expect(gig.location).toBe('Berlin, Germany')
    expect(gig.date).toBe('2026-08-01T20:00:00Z')
    expect(gig.ticketUrl).toBe('https://tickets.example.com/1')
    expect(gig.description).toBe('Industrial night.')
  })

  it('falls back to title when venue is missing', () => {
    const gig = mapGigRowToOverlayGig({
      id: 'gig-2',
      title: 'Warehouse Rave',
      venue: null,
      city: 'Vienna',
      country: 'Austria',
      event_date: '2026-09-01',
      ticket_url: null,
      festival_name: null,
      description: null,
    })

    expect(gig.venue).toBe('Warehouse Rave')
    expect(gig.location).toBe('Vienna, Austria')
    expect(gig.ticketUrl).toBeUndefined()
  })
})