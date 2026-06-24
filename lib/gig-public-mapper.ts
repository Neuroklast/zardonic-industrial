import type { Gig } from '@/lib/app-types'

export interface PublicGigRow {
  id: string
  title: string
  venue: string | null
  city: string | null
  country: string | null
  event_date: string
  ticket_url: string | null
  festival_name: string | null
  description?: string | null
}

/** Map a Supabase gig row to the overlay `Gig` shape used by CyberpunkOverlay. */
export function mapGigRowToOverlayGig(row: PublicGigRow): Gig {
  const location = [row.city, row.country].filter(Boolean).join(', ')
  const displayVenue = row.venue?.trim() || row.festival_name?.trim() || row.title
  const displayTitle = row.festival_name?.trim() || row.title

  return {
    id: row.id,
    title: displayTitle,
    venue: displayVenue,
    location: location || displayVenue,
    date: row.event_date,
    ticketUrl: row.ticket_url ?? undefined,
    description: row.description?.trim() || undefined,
  }
}