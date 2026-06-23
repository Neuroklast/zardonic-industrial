import type { SupabaseClient } from '@supabase/supabase-js'
import { parseCatalogueSyncConfig } from '@/lib/catalogue-sync-config'

const BANDSINTOWN_API_BASE = 'https://rest.bandsintown.com'

export interface BandsintownApiVenue {
  name?: string
  city?: string
  region?: string
  country?: string
  street_address?: string
  postal_code?: string
  latitude?: string
  longitude?: string
}

export interface BandsintownApiEvent {
  id: string | number
  datetime?: string
  starts_at?: string
  url?: string
  sold_out?: boolean
  description?: string
  title?: string
  lineup?: string[]
  offers?: { url?: string }[]
  venue?: BandsintownApiVenue
}

export interface BandsintownGigRow {
  title: string
  venue: string | null
  city: string | null
  country: string | null
  event_date: string
  ticket_url: string | null
  festival_name: string | null
  description: string | null
  bandsintown_id: string
  active: boolean
}

export interface BandsintownSyncResult {
  synced: number
  updated: number
  skipped: number
  errors: string[]
}

export async function fetchBandsintownEventsFromApi(
  artistName: string,
  apiKey: string,
  includePast = true,
): Promise<BandsintownApiEvent[]> {
  const url = new URL(`${BANDSINTOWN_API_BASE}/artists/${encodeURIComponent(artistName)}/events`)
  url.searchParams.set('app_id', apiKey)
  if (includePast) url.searchParams.set('date', 'all')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (response.status === 404) return []
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Bandsintown API returned ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? (data as BandsintownApiEvent[]) : []
}

export function mapBandsintownEventToGigRow(event: BandsintownApiEvent): BandsintownGigRow | null {
  const bandsintownId = event.id != null ? String(event.id) : ''
  const eventDateRaw = event.datetime || event.starts_at
  if (!bandsintownId || !eventDateRaw) return null

  const eventDate = new Date(eventDateRaw)
  if (Number.isNaN(eventDate.getTime())) return null

  const venueName = event.venue?.name?.trim() || null
  const city = event.venue?.city?.trim() || null
  const country = event.venue?.country?.trim() || null
  const eventTitle = event.title?.trim() || null

  const title = eventTitle || venueName || 'Live Show'
  const festivalName = eventTitle && venueName && eventTitle !== venueName ? eventTitle : null

  const ticketUrl = event.offers?.find((offer) => offer.url)?.url || event.url || null
  const descriptionParts = [
    event.description?.trim(),
    event.lineup?.length ? `Lineup: ${event.lineup.join(', ')}` : '',
    event.sold_out ? 'Status: Sold out' : '',
  ].filter(Boolean)

  return {
    title,
    venue: venueName,
    city,
    country,
    event_date: eventDate.toISOString(),
    ticket_url: ticketUrl,
    festival_name: festivalName,
    description: descriptionParts.length > 0 ? descriptionParts.join('\n') : null,
    bandsintown_id: bandsintownId,
    active: true,
  }
}

export async function resolveBandsintownArtistName(
  supabase: SupabaseClient,
  fallback = 'Zardonic',
): Promise<string> {
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'catalogue_sync')
    .maybeSingle()

  const config = parseCatalogueSyncConfig(data?.value)
  return config.artistName.trim() || fallback
}

export async function syncBandsintownGigsToSupabase(
  supabase: SupabaseClient,
  artistName: string,
  apiKey: string,
): Promise<BandsintownSyncResult> {
  const result: BandsintownSyncResult = { synced: 0, updated: 0, skipped: 0, errors: [] }

  let rawEvents: BandsintownApiEvent[]
  try {
    rawEvents = await fetchBandsintownEventsFromApi(artistName, apiKey, true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bandsintown fetch failed'
    return { synced: 0, updated: 0, skipped: 0, errors: [message] }
  }

  const mapped = rawEvents
    .map(mapBandsintownEventToGigRow)
    .filter((row): row is BandsintownGigRow => row !== null)

  const { data: existingRows, error: existingError } = await supabase
    .from('gigs')
    .select('id, bandsintown_id, title, event_date')
    .not('bandsintown_id', 'is', null)

  if (existingError) {
    result.errors.push(`Failed to load existing gigs: ${existingError.message}`)
    return result
  }

  const existingByBitId = new Map<string, { id: string; title: string; event_date: string }>()
  for (const row of existingRows ?? []) {
    if (!row.bandsintown_id || !row.id) continue
    existingByBitId.set(row.bandsintown_id, {
      id: row.id,
      title: row.title,
      event_date: row.event_date,
    })
  }

  for (const gig of mapped) {
    const existing = existingByBitId.get(gig.bandsintown_id)
    if (existing) {
      const { error } = await supabase
        .from('gigs')
        .update({
          title: gig.title,
          venue: gig.venue,
          city: gig.city,
          country: gig.country,
          event_date: gig.event_date,
          ticket_url: gig.ticket_url,
          festival_name: gig.festival_name,
          description: gig.description,
          active: true,
        })
        .eq('id', existing.id)

      if (error) {
        result.errors.push(`Failed to update "${gig.title}": ${error.message}`)
      } else {
        result.updated++
      }
      continue
    }

    const { error } = await supabase.from('gigs').insert(gig)
    if (error) {
      result.errors.push(`Failed to insert "${gig.title}": ${error.message}`)
    } else {
      result.synced++
      existingByBitId.set(gig.bandsintown_id, {
        id: gig.bandsintown_id,
        title: gig.title,
        event_date: gig.event_date,
      })
    }
  }

  return result
}