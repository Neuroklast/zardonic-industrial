'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { uploadBufferToR2 } from './r2Upload'
import { MEDIA_BUCKET } from '@/lib/constants'
import {
  fetchItunesArtistCatalogue,
  parseItunesItem,
  type ItunesSearchResult,
} from '@/lib/itunes-sync'
import {
  parseCatalogueSyncConfig,
  type CatalogueSyncConfig,
} from '@/lib/catalogue-sync-config'
import { normalizeItunesArtistId } from '@/lib/release-external-ids'
import { revalidatePath } from 'next/cache'

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'
const R2_BUCKET = MEDIA_BUCKET

export interface ItunesSyncResult {
  synced: number
  skipped: number
  errors: string[]
}

async function loadCatalogueSyncConfig(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<CatalogueSyncConfig> {
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'catalogue_sync')
    .maybeSingle()
  return parseCatalogueSyncConfig(data?.value)
}

async function fetchItunesItemsForArtist(
  artistName: string,
  itunesArtistId: string | null,
  result: ItunesSyncResult,
): Promise<ItunesSearchResult[]> {
  if (itunesArtistId) {
    const items = await fetchItunesArtistCatalogue(itunesArtistId)
    if (items.length === 0) result.errors.push('No releases found for configured iTunes artist ID')
    return items
  }

  const [albumsRes, songsRes, singlesRes] = await Promise.allSettled([
    fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artistName)}&entity=album&limit=200`),
    fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artistName)}&entity=song&limit=200`),
    fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artistName)}&entity=musicVideo&limit=200`),
  ])

  const items: ItunesSearchResult[] = []

  if (albumsRes.status === 'fulfilled' && albumsRes.value.ok) {
    const data = (await albumsRes.value.json()) as { results?: ItunesSearchResult[] }
    items.push(...(data.results ?? []))
  } else {
    result.errors.push('Failed to fetch albums from iTunes')
  }

  if (songsRes.status === 'fulfilled' && songsRes.value.ok) {
    const data = (await songsRes.value.json()) as { results?: ItunesSearchResult[] }
    items.push(...(data.results ?? []))
  }

  if (singlesRes.status === 'fulfilled' && singlesRes.value.ok) {
    const data = (await singlesRes.value.json()) as { results?: ItunesSearchResult[] }
    items.push(...(data.results ?? []))
  }

  return items
}

export async function syncReleasesFromItunes(artist?: string): Promise<ItunesSyncResult> {
  const result: ItunesSyncResult = { synced: 0, skipped: 0, errors: [] }

  const actionResult = await runAdminAction(async () => {
    const supabase = createAdminClient()
    const config = await loadCatalogueSyncConfig(supabase)
    const artistName = (artist?.trim() || config.artistName).trim()
    const itunesArtistId = normalizeItunesArtistId(config.itunesArtistId)

    if (!artistName && !itunesArtistId) {
      result.errors.push('Configure an artist name or iTunes artist ID in Catalogue Sync settings')
      return result
    }

    const items = await fetchItunesItemsForArtist(artistName, itunesArtistId, result)
    if (items.length === 0 && result.errors.length > 0) return result

    // Gate via registry for AGENTS §12 compliance on mutations
    const dispatchResult = dispatchAdminAction(
      'itunes_sync',
      { artist: artistName, itunesArtistId: itunesArtistId ?? undefined },
      createSupabaseActionContext(supabase),
    )
    if (!dispatchResult.ok) return { synced: 0, skipped: 0, errors: [dispatchResult.error] }

    const { data: existing } = await supabase
      .from('releases')
      .select('itunes_id')
      .not('itunes_id', 'is', null)

    const existingIds = new Set((existing ?? []).map((row: { itunes_id: string | null }) => row.itunes_id as string))

    const { data: maxRow } = await supabase
      .from('releases')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    let displayOrder = ((maxRow as { display_order?: number } | null)?.display_order ?? -1) + 1

    for (const item of items) {
      const parsed = parseItunesItem(item)
      if (!parsed) continue

      if (existingIds.has(parsed.itunes_id)) {
        result.skipped++
        continue
      }

      // Strong protection: never overwrite releases the user has manually edited or that already exist by title
      // This addresses the "kept reverting" issue from tester feedback
      const { count: titleCount } = await supabase
        .from('releases')
        .select('*', { count: 'exact', head: true })
        .ilike('title', parsed.title)

      if ((titleCount ?? 0) > 0) {
        result.skipped++
        continue
      }

      let coverStoragePath: string | null = null
      let coverUrl: string | null = parsed.artworkUrl

      if (parsed.artworkUrl && process.env.R2_ACCOUNT_ID) {
        try {
          const artRes = await fetch(parsed.artworkUrl)
          if (artRes.ok) {
            const buffer = Buffer.from(await artRes.arrayBuffer())
            const objectPath = `releases/itunes-${parsed.itunes_id}.jpg`
            const { publicUrl } = await uploadBufferToR2(R2_BUCKET, objectPath, buffer, 'image/jpeg')
            coverStoragePath = objectPath
            coverUrl = publicUrl
          }
        } catch (error) {
          result.errors.push(
            `Artwork upload failed for "${parsed.title}": ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }

      const { error: insertError } = await supabase.from('releases').insert({
        title: parsed.title,
        type: parsed.type,
        release_date: parsed.release_date,
        itunes_id: parsed.itunes_id,
        cover_storage_path: coverStoragePath,
        cover_url: coverUrl,
        streaming_links: [],
        artists: [artistName],
        display_order: displayOrder,
        active: true,
      })

      if (insertError) {
        result.errors.push(`Failed to insert "${parsed.title}": ${insertError.message}`)
      } else {
        result.synced++
        displayOrder++
        existingIds.add(parsed.itunes_id)
      }
    }

    revalidatePath('/admin/releases')
    revalidatePath('/')

    return result
  }, 'Unable to sync releases from iTunes.')

  return 'error' in actionResult ? { synced: 0, skipped: 0, errors: [actionResult.error] } : actionResult
}

export interface ItunesCoverResult {
  ok: boolean
  coverStoragePath?: string
  coverUrl?: string
  itunesId?: string
  error?: string
}

export async function fetchItunesCoverForRelease(releaseId: string): Promise<ItunesCoverResult> {
  const actionResult = await runAdminAction(async () => {
    const supabase = createAdminClient()
    const { data: release, error: fetchError } = await supabase
      .from('releases')
      .select('id, title, artists, itunes_id')
      .eq('id', releaseId)
      .single()

    if (fetchError || !release) {
      return { ok: false, error: fetchError?.message ?? 'Release not found' }
    }

    const title = release.title as string
    const artists = Array.isArray(release.artists) ? (release.artists as string[]) : []
    const searchTerm = artists[0] ? `${title} ${artists[0]}` : title

    const searchRes = await fetch(
      `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(searchTerm)}&entity=song&limit=5`,
    )
    if (!searchRes.ok) return { ok: false, error: 'iTunes search failed' }

    const searchData = (await searchRes.json()) as { results?: ItunesSearchResult[] }
    const match =
      (searchData.results ?? []).find(
        (item) =>
          (item.trackName ?? item.collectionName ?? '').toLowerCase() === title.toLowerCase(),
      ) ?? searchData.results?.[0]

    if (!match) return { ok: false, error: 'No matching artwork found on iTunes' }

    const parsed = parseItunesItem(match)
    if (!parsed?.artworkUrl) return { ok: false, error: 'Matched item has no artwork' }

    const artRes = await fetch(parsed.artworkUrl)
    if (!artRes.ok) return { ok: false, error: 'Failed to download artwork' }

    const buffer = Buffer.from(await artRes.arrayBuffer())
    const objectPath = `releases/itunes-${parsed.itunes_id}.jpg`
    const { publicUrl } = await uploadBufferToR2(R2_BUCKET, objectPath, buffer, 'image/jpeg')

    const { error: updateError } = await supabase
      .from('releases')
      .update({
        cover_storage_path: objectPath,
        cover_url: publicUrl,
        itunes_id: parsed.itunes_id,
        manually_edited: true,
      })
      .eq('id', releaseId)

    if (updateError) return { ok: false, error: updateError.message }

    revalidatePath('/admin/releases')
    revalidatePath(`/admin/releases/${releaseId}`)
    revalidatePath('/')

    return {
      ok: true,
      coverStoragePath: objectPath,
      coverUrl: publicUrl,
      itunesId: parsed.itunes_id,
    }
  }, 'Unable to fetch iTunes cover.')

  if ('error' in actionResult) return { ok: false, error: actionResult.error }
  return actionResult
}
