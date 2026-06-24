import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import type { PublicGigRow } from '@/lib/gig-public-mapper'
import {
  mapReleaseRowToOverlayRelease,
  parseStreamingLinks,
  type ReleaseDbRow,
} from '@/lib/release-public-mapper'
import type { Release } from '@/lib/app-types'

export interface PublicReleaseCardItem {
  id: string
  title: string
  type: string
  release_date: string | null
  coverUrl: string | null
  streamingLinks: Array<{ platform: string; url: string }>
  manually_edited?: boolean
  overlayRelease: Release
}

export async function fetchPublicReleaseRows(): Promise<ReleaseDbRow[]> {
  const supabase = await createClient()
  const fullSelect =
    'id, title, type, release_date, description, cover_storage_path, cover_url, streaming_links, artists, tracks, custom_links, manually_edited'
  const legacySelect =
    'id, title, type, release_date, cover_storage_path, cover_url, streaming_links, manually_edited'
  const minimalSelect =
    'id, title, type, release_date, cover_storage_path, cover_url, streaming_links'

  const { data, error } = await supabase
    .from('releases')
    .select(fullSelect)
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (!error) return (data ?? []) as ReleaseDbRow[]

  console.error('[fetchPublicReleaseRows] releases query failed:', error.message)

  const fallbackSelect = error.message.includes('manually_edited') ? minimalSelect : legacySelect
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('releases')
    .select(fallbackSelect)
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (fallbackError) {
    console.error('[fetchPublicReleaseRows] releases fallback query failed:', fallbackError.message)
    return []
  }

  return (fallbackData ?? []).map((row: Partial<ReleaseDbRow>) => ({
    ...(row as ReleaseDbRow),
    description: null,
    artists: [],
    tracks: [],
    custom_links: [],
    manually_edited: 'manually_edited' in row ? !!(row as ReleaseDbRow).manually_edited : false,
  }))
}

export function mapReleaseRowsToCardItems(rows: ReleaseDbRow[]): PublicReleaseCardItem[] {
  return rows.map((row) => {
    const coverUrl = resolveImageUrl(row.cover_storage_path, row.cover_url)
    const streamingLinks = parseStreamingLinks(row.streaming_links)
    const overlayRelease = mapReleaseRowToOverlayRelease(row, coverUrl)

    return {
      id: row.id,
      title: row.title,
      type: row.type,
      release_date: row.release_date,
      coverUrl,
      streamingLinks,
      manually_edited: !!row.manually_edited,
      overlayRelease,
    }
  })
}

export async function fetchPublicReleaseCardItems(): Promise<PublicReleaseCardItem[]> {
  const rows = await fetchPublicReleaseRows()
  return mapReleaseRowsToCardItems(rows)
}

export async function fetchPublicGigs(): Promise<PublicGigRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gigs')
    .select('id, title, venue, city, country, event_date, ticket_url, festival_name, description')
    .eq('active', true)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('[fetchPublicGigs] gigs query failed:', error.message)
    return []
  }

  return (data ?? []) as PublicGigRow[]
}

export async function fetchPublicArtistName(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'hero')
      .maybeSingle()

    const headline = data?.value && typeof data.value === 'object'
      ? (data.value as Record<string, unknown>).headline
      : null

    return typeof headline === 'string' && headline.trim() ? headline.trim() : 'ZARDONIC'
  } catch {
    return 'ZARDONIC'
  }
}