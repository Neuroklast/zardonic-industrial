'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext, dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { cacheReleaseCoverToR2 } from '@/lib/release-cover-r2'
import {
  buildReleaseUpdateFromMetadata,
  fetchReleaseMetadataByExternalId,
} from '@/lib/release-external-sync'
import {
  parseCatalogueSyncConfig,
  type CatalogueSyncConfig,
} from '@/lib/catalogue-sync-config'
import {
  importCatalogueItems,
  type BulkExternalSyncResult,
} from '@/lib/catalogue-import'
import {
  normalizeDiscogsArtistId,
  normalizeExternalId,
  normalizeSpotifyArtistId,
  type ExternalReleaseSource,
} from '@/lib/release-external-ids'
import { consolidateDuplicateReleases } from '@/lib/release-consolidation'
import { runFullCatalogueEnrichment } from '@/lib/release-enrichment'
import type { ReleaseMetadata, StreamingLink } from '@/lib/release-metadata'
import {
  fetchDiscogsArtistReleases,
  searchDiscogsArtistId,
} from '@/lib/discogs-sync'
import { getSpotifyAccessToken } from '@/lib/spotify-client'
import {
  fetchSpotifyArtistAlbums,
  searchSpotifyArtistId,
} from '@/lib/spotify-sync'
import {
  fetchOdesliStreamingLinks,
  mergeOdesliIntoReleaseLinks,
} from '@/lib/release-streaming-enrichment'
import { shouldImportCoverFromSource } from '@/lib/release-cover-art'
import { revalidatePath } from 'next/cache'

export interface ReleaseExternalPreviewResult {
  ok: boolean
  metadata?: ReleaseMetadata
  error?: string
}

export interface ReleaseExternalSyncResult {
  ok: boolean
  metadata?: ReleaseMetadata
  coverUrl?: string
  coverStoragePath?: string
  error?: string
}

export type { BulkExternalSyncResult } from '@/lib/catalogue-import'

export async function previewReleaseFromExternalId(
  source: ExternalReleaseSource,
  rawId: string,
): Promise<ReleaseExternalPreviewResult> {
  const normalized = normalizeExternalId(source, rawId)
  if (!normalized) return { ok: false, error: 'Invalid external id or URL' }

  const metadata = await fetchReleaseMetadataByExternalId(source, normalized)
  if (!metadata) {
    const hint =
      source === 'spotify'
        ? 'Check Spotify credentials in Admin → API Keys'
        : source === 'discogs'
          ? 'Check Discogs token in Admin → API Keys'
          : 'ID not found on iTunes'
    return { ok: false, error: `Could not fetch metadata from ${source}. ${hint}.` }
  }

  return { ok: true, metadata }
}

export async function syncReleaseFromExternalId(
  releaseId: string,
  source: ExternalReleaseSource,
  rawId: string,
): Promise<ReleaseExternalSyncResult> {
  const normalized = normalizeExternalId(source, rawId)
  if (!normalized) return { ok: false, error: 'Invalid external id or URL' }

  const dispatchResult = dispatchAdminActionAsAdmin(
    'release_external_sync',
    { releaseId, source, externalId: normalized },
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { ok: false, error: dispatchResult.error }

  const actionResult = await runAdminAction(async () => {
    const supabase = createAdminClient()
    const { data: existing, error: fetchError } = await supabase
      .from('releases')
      .select('id, streaming_links')
      .eq('id', releaseId)
      .single()

    if (fetchError || !existing) return { ok: false, error: fetchError?.message ?? 'Release not found' }

    const metadata = await fetchReleaseMetadataByExternalId(source, normalized)
    if (!metadata) return { ok: false, error: `Could not fetch metadata from ${source}` }

    const existingLinks = Array.isArray(existing.streaming_links)
      ? (existing.streaming_links as StreamingLink[])
      : []

    const update = buildReleaseUpdateFromMetadata(metadata, existingLinks, source)

    const odesliLinks = await fetchOdesliStreamingLinks({
      itunes_id: metadata.itunes_id ?? (source === 'itunes' ? normalized : null),
      spotify_id: metadata.spotify_id ?? (source === 'spotify' ? normalized : null),
      streaming_links: update.streaming_links ?? existingLinks,
    })
    if (odesliLinks.length > 0) {
      update.streaming_links = mergeOdesliIntoReleaseLinks(
        update.streaming_links ?? existingLinks,
        odesliLinks,
      )
    }

    if (shouldImportCoverFromSource(source) && metadata.coverUrl) {
      const cached = await cacheReleaseCoverToR2(metadata.coverUrl, source, normalized)
      if (cached) {
        update.cover_storage_path = cached.cover_storage_path
        update.cover_url = cached.cover_url
      } else {
        update.cover_url = metadata.coverUrl
      }
    }

    const { error: updateError } = await supabase.from('releases').update(update).eq('id', releaseId)
    if (updateError) return { ok: false, error: updateError.message }

    revalidatePath('/admin/releases')
    revalidatePath(`/admin/releases/${releaseId}`)
    revalidatePath('/')
    revalidatePath('/releases')

    return {
      ok: true,
      metadata,
      coverUrl: typeof update.cover_url === 'string' ? update.cover_url : undefined,
      coverStoragePath: typeof update.cover_storage_path === 'string' ? update.cover_storage_path : undefined,
    }
  }, `Unable to sync release from ${source}.`)

  if ('error' in actionResult) return { ok: false, error: actionResult.error }
  return actionResult
}

async function bulkImportMetadata(
  source: ExternalReleaseSource,
  idField: 'itunes_id' | 'spotify_id' | 'discogs_id',
  items: Array<{ externalId: string; metadata: ReleaseMetadata }>,
  registryAction: 'itunes_sync' | 'spotify_sync' | 'discogs_sync',
  registryPayload: Record<string, unknown>,
): Promise<BulkExternalSyncResult> {
  const dispatchResult = dispatchAdminActionAsAdmin(
    registryAction,
    registryPayload,
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { synced: 0, updated: 0, skipped: 0, errors: [dispatchResult.error] }

  const actionResult = await runAdminAction(async () => {
    const supabase = createAdminClient()

    const config = await loadCatalogueSyncConfig()
    const importResult = await importCatalogueItems(supabase, {
      source,
      idField,
      items,
      lightImport: false,
      linkCrossSource: true,
      matchOptions: { artistNames: [config.artistName] },
      cacheCover: async (coverUrl, coverSource, externalId) => {
        if (!shouldImportCoverFromSource(coverSource)) return null
        return cacheReleaseCoverToR2(coverUrl, coverSource, externalId)
      },
    })

    const consolidation = await consolidateDuplicateReleases(supabase, {
      artistNames: [config.artistName],
    })
    const enrichment = await runFullCatalogueEnrichment(
      supabase,
      config.artistName || 'Zardonic',
    )

    const errors = [...importResult.errors, ...consolidation.errors, ...enrichment.errors]
    if (consolidation.deleted > 0) {
      errors.unshift(
        `Consolidated ${consolidation.deleted} duplicate release(s) across iTunes/Spotify/Discogs`,
      )
    }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    revalidatePath('/releases')
    return {
      synced: importResult.synced,
      updated: importResult.updated + consolidation.merged + enrichment.enriched,
      skipped: importResult.skipped + consolidation.skipped + enrichment.skipped,
      errors,
    }
  }, `Unable to sync releases from ${source}.`)

  return 'error' in actionResult
    ? { synced: 0, updated: 0, skipped: 0, errors: [actionResult.error] }
    : actionResult
}

async function loadCatalogueSyncConfig(): Promise<CatalogueSyncConfig> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'catalogue_sync')
    .maybeSingle()
  return parseCatalogueSyncConfig(data?.value)
}

export async function syncReleasesFromSpotify(artist?: string): Promise<BulkExternalSyncResult> {
  const token = await getSpotifyAccessToken()
  if (!token) {
    return {
      synced: 0,
      updated: 0,
      skipped: 0,
      errors: ['Spotify API credentials missing. Configure them in Admin → API Keys.'],
    }
  }

  const config = await loadCatalogueSyncConfig()
  const artistName = (artist?.trim() || config.artistName).trim()
  const configuredId = normalizeSpotifyArtistId(config.spotifyArtistId)

  const artistId = configuredId ?? (artistName ? await searchSpotifyArtistId(artistName) : null)
  if (!artistId) {
    return {
      synced: 0,
      updated: 0,
      skipped: 0,
      errors: [
        configuredId
          ? 'Invalid Spotify artist ID in Catalogue Sync settings'
          : 'Configure a Spotify artist ID or artist name in Catalogue Sync settings',
      ],
    }
  }

  const albums = await fetchSpotifyArtistAlbums(artistId)
  if (albums.length === 0) {
    return {
      synced: 0,
      updated: 0,
      skipped: 0,
      errors: [
        'Spotify returned no albums for this artist. Check the artist ID and that API credentials are valid (Admin → API Keys).',
      ],
    }
  }

  const items = albums.map((a) => ({ externalId: a.spotify_id, metadata: a.metadata }))
  return bulkImportMetadata('spotify', 'spotify_id', items, 'spotify_sync', {
    artist: artistName,
    spotifyArtistId: artistId,
  })
}

export async function syncReleasesFromDiscogs(artist?: string): Promise<BulkExternalSyncResult> {
  const config = await loadCatalogueSyncConfig()
  const artistName = (artist?.trim() || config.artistName).trim()
  const configuredId = normalizeDiscogsArtistId(config.discogsArtistId)

  let artistId: number | null = null
  if (configuredId) {
    const parsed = Number.parseInt(configuredId, 10)
    artistId = Number.isFinite(parsed) ? parsed : null
  } else if (artistName) {
    artistId = await searchDiscogsArtistId(artistName)
  }

  if (!artistId) {
    return {
      synced: 0,
      updated: 0,
      skipped: 0,
      errors: [
        configuredId
          ? 'Invalid Discogs artist ID in Catalogue Sync settings'
          : 'Configure a Discogs artist ID or artist name in Catalogue Sync settings',
      ],
    }
  }

  const releases = await fetchDiscogsArtistReleases(artistId)
  const items = releases.map((r) => ({ externalId: r.discogs_id, metadata: r.metadata }))
  return bulkImportMetadata('discogs', 'discogs_id', items, 'discogs_sync', {
    artist: artistName,
    discogsArtistId: artistId,
  })
}