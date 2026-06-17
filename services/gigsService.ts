import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { gigSchema, type Gig } from '@/lib/schemas/gig'
import { DEMO_GIGS } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

export async function getUpcomingGigs(): Promise<ServiceResult<Gig[]>> {
  if (isDev) return ok(DEMO_GIGS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('active', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(50)

    if (error) return err(error.message)
    return _parseGigs(data ?? [], hideDemoFallback)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load gigs')
  }
}

export async function getAllGigs(): Promise<ServiceResult<Gig[]>> {
  if (isDev) return ok(DEMO_GIGS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(200)

    if (error) return err(error.message)
    return _parseGigs(data ?? [], true)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load gigs')
  }
}

function _parseGigs(
  rows: Record<string, unknown>[],
  skipFallback: boolean,
): ServiceResult<Gig[]> {
  const gigs: Gig[] = []
  for (const row of rows) {
    const parsed = gigSchema.safeParse({
      id: String(row.id),
      title: String(row.title ?? ''),
      venue: row.venue ?? null,
      city: row.city ?? null,
      country: row.country ?? null,
      eventDate: String(row.event_date ?? ''),
      ticketUrl: row.ticket_url ?? null,
      festivalName: row.festival_name ?? null,
      description: row.description ?? null,
    })
    if (parsed.success) gigs.push(parsed.data)
  }
  if (gigs.length === 0 && !skipFallback) return ok(DEMO_GIGS)
  return ok(gigs)
}
