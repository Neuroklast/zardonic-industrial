'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { uploadBufferToR2 } from './r2Upload'
import { MEDIA_BUCKET } from '@/lib/constants'
import {
  buildItunesCatalogueImportItems,
  parseItunesItem,
  type ItunesSearchResult,
} from '@/lib/itunes-sync'
import {
  parseCatalogueSyncConfig,
  type CatalogueSyncConfig,
} from '@/lib/catalogue-sync-config'
import { normalizeItunesArtistId } from '@/lib/release-external-ids'
import { importCatalogueItems } from '@/lib/catalogue-import'
import { consolidateDuplicateReleases } from '@/lib/release-consolidation'
import { runFullCatalogueEnrichment } from '@/lib/release-enrichment'
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

async function cacheItunesCover(
  coverUrl: string,
  externalId: string,
): Promise<{ cover_storage_path: string; cover_url: string } | null> {
  if (!process.env.R2_ACCOUNT_ID) return null
  try {
    const artRes = await fetch(coverUrl, { cache: 'no-store' })
    if (!artRes.ok) return null
    const buffer = Buffer.from(await artRes.arrayBuffer())
    const objectPath = `releases/itunes-${externalId}.jpg`
    const { publicUrl } = await uploadBufferToR2(R2_BUCKET, objectPath, buffer, 'image/jpeg')
    return { cover_storage_path: objectPath, cover_url: publicUrl }
  } catch {
    return null
  }
}

export async function syncReleasesFromItunes(artist?: string): Promise<ItunesSyncResult> {
  const actionResult = await runAdminAction(async () => {
    const supabase = createAdminClient()
    const config = await loadCatalogueSyncConfig(supabase)
    const artistName = (artist?.trim() || config.artistName).trim()
    const itunesArtistId = normalizeItunesArtistId(config.itunesArtistId)

    if (!artistName && !itunesArtistId) {
      return {
        synced: 0,
        skipped: 0,
        errors: ['Configure an artist name or iTunes artist ID in Catalogue Sync settings'],
      }
    }

    const { items, errors: fetchErrors } = await buildItunesCatalogueImportItems({
      artistName,
      itunesArtistId,
    })

    if (items.length === 0) {
      return {
        synced: 0,
        skipped: 0,
        errors:
          fetchErrors.length > 0
            ? fetchErrors
            : ['No releases found for configured iTunes artist ID or name'],
      }
    }

    const dispatchResult = dispatchAdminActionAsAdmin(
      'itunes_sync',
      { artist: artistName, itunesArtistId: itunesArtistId ?? undefined },
      createSupabaseActionContext(supabase),
    )
    if (!dispatchResult.ok) {
      return { synced: 0, skipped: 0, errors: [dispatchResult.error] }
    }

    const importResult = await importCatalogueItems(supabase, {
      source: 'itunes',
      idField: 'itunes_id',
      items,
      lightImport: false,
      linkCrossSource: true,
      cacheCover: (coverUrl, _source, externalId) => cacheItunesCover(coverUrl, externalId),
    })

    const consolidation = await consolidateDuplicateReleases(supabase)
    const enrichment = await runFullCatalogueEnrichment(supabase, artistName || 'Zardonic')

    const errors = [...fetchErrors, ...importResult.errors, ...consolidation.errors, ...enrichment.errors]
    if (consolidation.deleted > 0) {
      errors.unshift(
        `Consolidated ${consolidation.deleted} duplicate release(s) across iTunes/Spotify/Discogs`,
      )
    }

    revalidatePath('/admin/releases')
    revalidatePath('/')

    return {
      synced: importResult.synced + importResult.updated + consolidation.merged + enrichment.enriched,
      skipped: importResult.skipped + consolidation.skipped + enrichment.skipped,
      errors,
    }
  }, 'Unable to sync releases from iTunes.')

  return 'error' in actionResult
    ? { synced: 0, skipped: 0, errors: [actionResult.error] }
    : actionResult
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

    const cached = await cacheItunesCover(parsed.artworkUrl, parsed.itunes_id)
    if (!cached) return { ok: false, error: 'Failed to cache artwork' }

    const { error: updateError } = await supabase
      .from('releases')
      .update({
        cover_storage_path: cached.cover_storage_path,
        cover_url: cached.cover_url,
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
      coverStoragePath: cached.cover_storage_path,
      coverUrl: cached.cover_url,
      itunesId: parsed.itunes_id,
    }
  }, 'Unable to fetch iTunes cover.')

  if ('error' in actionResult) return { ok: false, error: actionResult.error }
  return actionResult
}