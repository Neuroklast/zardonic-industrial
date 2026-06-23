import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchBandsintownEventsFromApi,
  mapBandsintownEventToGigRow,
  syncBandsintownGigsToSupabase,
} from '@/lib/bandsintown-sync'

describe('mapBandsintownEventToGigRow', () => {
  it('maps API event into Supabase gig row', () => {
    const row = mapBandsintownEventToGigRow({
      id: 101,
      datetime: '2026-09-15T20:00:00',
      title: 'Industrial Night',
      url: 'https://bandsintown.com/e/101',
      offers: [{ url: 'https://tickets.example.com' }],
      venue: { name: 'Club Voltage', city: 'Berlin', country: 'Germany' },
      lineup: ['Zardonic', 'Guest'],
      sold_out: true,
      description: 'Special set',
    })

    expect(row).toMatchObject({
      title: 'Industrial Night',
      venue: 'Club Voltage',
      city: 'Berlin',
      country: 'Germany',
      ticket_url: 'https://tickets.example.com',
      festival_name: 'Industrial Night',
      bandsintown_id: '101',
      active: true,
    })
    expect(row?.event_date).toContain('2026-09-15')
    expect(row?.description).toContain('Lineup: Zardonic, Guest')
  })

  it('returns null when id or datetime is missing', () => {
    expect(mapBandsintownEventToGigRow({ id: 1 })).toBeNull()
    expect(mapBandsintownEventToGigRow({ datetime: '2026-01-01T12:00:00' })).toBeNull()
  })
})

describe('fetchBandsintownEventsFromApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))
    const events = await fetchBandsintownEventsFromApi('Zardonic', 'test-key', true)
    expect(events).toEqual([])
  })

  it('throws on upstream failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad', { status: 500 }))
    await expect(fetchBandsintownEventsFromApi('Zardonic', 'test-key', true)).rejects.toThrow(
      'Bandsintown API returned 500',
    )
  })
})

describe('syncBandsintownGigsToSupabase', () => {
  it('inserts new gigs and updates existing ones by bandsintown_id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 42,
            datetime: '2026-10-01T19:00:00',
            venue: { name: 'Arena', city: 'Vienna', country: 'Austria' },
          },
        ]),
        { status: 200 },
      ),
    )

    const updates: Array<Record<string, unknown>> = []
    const inserts: Array<Record<string, unknown>> = []

    const supabase = {
      from: (table: string) => {
        expect(table).toBe('gigs')
        return {
          select: () => ({
            not: async () => ({
              data: [{ id: 'existing-1', bandsintown_id: '42', title: 'Old', event_date: '2026-10-01T19:00:00Z' }],
              error: null,
            }),
          }),
          insert: async (row: Record<string, unknown>) => {
            inserts.push(row)
            return { error: null }
          },
          update: (row: Record<string, unknown>) => {
            updates.push(row)
            return {
              eq: async () => ({ error: null }),
            }
          },
        }
      },
    }

    const result = await syncBandsintownGigsToSupabase(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
      'Zardonic',
      'test-key',
    )

    expect(result.updated).toBe(1)
    expect(result.synced).toBe(0)
    expect(inserts).toHaveLength(0)
    expect(updates[0]).toMatchObject({ venue: 'Arena', city: 'Vienna' })
  })
})