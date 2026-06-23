'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { uploadBufferToR2 } from '@/app/admin/_actions/r2Upload'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { MEDIA_BUCKET } from '@/lib/constants'
import {
  buildReleaseUpdateFromMetadata,
  fetchReleaseMetadataByExternalId,
} from '@/lib/release-external-sync'
import {
  parseCatalogueSyncConfig,
  type CatalogueSyncConfig,
} from '@/lib/catalogue-sync-config'
import {
  normalizeDiscogsArtistId,
  normalizeExternalId,
  normalizeSpotifyArtistId,
  type ExternalReleaseSource,
} from '@/lib/release-external-ids'
import { mergeStreamingLinks, type ReleaseMetadata, type StreamingLink } from '@/lib/release-metadata'
import {
  fetchDiscogsArtistReleases,
  fetchReleaseMetadataFromDiscogs,
  searchDiscogsArtistId,
} from '@/lib/discogs-sync'
import { getSpotifyAccessToken } from '@/lib/spotify-client'
import {
  fetchReleaseMetadataFromSpotify,
  fetchSpotifyArtistAlbums,
  searchSpotifyArtistId,
} from '@/lib/spotify-sync'
import { revalidatePath } from 'next/cache'

const R2_BUCKET = MEDIA_BUCKET

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

export interface BulkExternalSyncResult {
  synced: number
  updated: number
  skipped: number
  errors: string[]
}

async function cacheCoverToR2(
  coverUrl: string,
  objectPath: string,
): Promise<{ coverStoragePath: string; coverUrl: string } | null> {
  if (!process.env.R2_ACCOUNT_ID) return null
  try {
    const artRes = await fetch(coverUrl, { cache: 'no-store' })
    if (!artRes.ok) return null
    const contentType = artRes.headers.get('content-type') ?? 'image/jpeg'
    const buffer = Buffer.from(await artRes.arrayBuffer())
    const { publicUrl } = await uploadBufferToR2(R2_BUCKET, objectPath, buffer, contentType)
    return { coverStoragePath: objectPath, coverUrl: publicUrl }
  } catch {
    return null
  }
}

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
        ? 'Check SPOTIFY_CLIENT_ID/SECRET'
        : source === 'discogs'
          ? 'Check DISCOGS_TOKEN'
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

  const dispatchResult = dispatchAdminAction(
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

    if (metadata.coverUrl) {
      const ext = metadata.coverUrl.includes('.png') ? 'png' : 'jpg'
      const objectPath = `releases/${source}-${normalized}.${ext}`
      const cached = await cacheCoverToR2(metadata.coverUrl, objectPath)
      if (cached) {
        update.cover_storage_path = cached.coverStoragePath
        update.cover_url = cached.coverUrl
      } else {
        update.cover_url = metadata.coverUrl
      }
    }

    const { error: updateError } = await supabase.from('releases').update(update).eq('id', releaseId)
    if (updateError) return { ok: false, error: updateError.message }

    revalidatePath('/admin/releases')
    revalidatePath(`/admin/releases/${releaseId}`)
    revalidatePath('/')

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

function releaseTracksAreEmpty(tracks: unknown): boolean {
  return !Array.isArray(tracks) || tracks.length === 0
}

async function enrichMetadataForBulkImport(
  source: ExternalReleaseSource,
  externalId: string,
  baseMetadata: ReleaseMetadata,
): Promise<ReleaseMetadata> {
  if (source === 'spotify') {
    const enriched = await fetchReleaseMetadataFromSpotify(externalId)
    if (enriched) {
      return {
        ...enriched,
        streaming_links: mergeStreamingLinks(enriched.streaming_links, baseMetadata.streaming_links),
      }
    }
    return baseMetadata
  }

  if (source === 'discogs' && baseMetadata.discogs_id) {
    const enriched = await fetchReleaseMetadataFromDiscogs(baseMetadata.discogs_id)
    if (enriched) {
      return {
        ...enriched,
        streaming_links: mergeStreamingLinks(enriched.streaming_links, baseMetadata.streaming_links),
      }
    }
  }

  return baseMetadata
}

async function bulkImportMetadata(
  source: ExternalReleaseSource,
  idField: 'itunes_id' | 'spotify_id' | 'discogs_id',
  items: Array<{ externalId: string; metadata: ReleaseMetadata }>,
  registryAction: 'itunes_sync' | 'spotify_sync' | 'discogs_sync',
  registryPayload: Record<string, unknown>,
): Promise<BulkExternalSyncResult> {
  const result: BulkExternalSyncResult = { synced: 0, updated: 0, skipped: 0, errors: [] }

  const dispatchResult = dispatchAdminAction(
    registryAction,
    registryPayload,
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { synced: 0, updated: 0, skipped: 0, errors: [dispatchResult.error] }

  const actionResult = await runAdminAction(async () => {
    const supabase = createAdminClient()

    const { data: existingRows } = await supabase
      .from('releases')
      .select(`title, ${idField}`)
      .not(idField, 'is', null)

    const existingIds = new Set(
      (existingRows ?? [])
        .map((row: Record<string, string | null>) => row[idField])
        .filter((id: string | null | undefined): id is string => Boolean(id)),
    )

    const { data: maxRow } = await supabase
      .from('releases')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    let displayOrder = ((maxRow as { display_order?: number } | null)?.display_order ?? -1) + 1

    for (const { externalId, metadata: baseMetadata } of items) {
      if (existingIds.has(externalId)) {
        const { data: existingRow, error: existingError } = await supabase
          .from('releases')
          .select('id, tracks, streaming_links, manually_edited')
          .eq(idField, externalId)
          .maybeSingle()

        if (existingError) {
          result.errors.push(`Failed to load existing "${baseMetadata.title}": ${existingError.message}`)
          result.skipped++
          continue
        }

        const canUpdateTracks =
          existingRow &&
          !existingRow.manually_edited &&
          releaseTracksAreEmpty(existingRow.tracks) &&
          (source === 'spotify' || source === 'discogs')

        if (canUpdateTracks) {
          const metadata = await enrichMetadataForBulkImport(source, externalId, baseMetadata)
          if (metadata.tracks && metadata.tracks.length > 0) {
            const existingLinks = Array.isArray(existingRow.streaming_links)
              ? (existingRow.streaming_links as StreamingLink[])
              : []
            const update = buildReleaseUpdateFromMetadata(metadata, existingLinks, source)
            update.manually_edited = false

            const { error: updateError } = await supabase
              .from('releases')
              .update(update)
              .eq('id', existingRow.id)

            if (updateError) {
              result.errors.push(`Failed to update tracks for "${metadata.title}": ${updateError.message}`)
              result.skipped++
            } else {
              result.updated++
            }
            continue
          }
        }

        result.skipped++
        continue
      }

      const metadata = await enrichMetadataForBulkImport(source, externalId, baseMetadata)

      const { count: titleCount } = await supabase
        .from('releases')
        .select('*', { count: 'exact', head: true })
        .ilike('title', metadata.title)

      if ((titleCount ?? 0) > 0) {
        result.skipped++
        continue
      }

      let coverStoragePath: string | null = null
      let coverUrl: string | null = metadata.coverUrl

      if (metadata.coverUrl) {
        const objectPath = `releases/${source}-${externalId}.jpg`
        const cached = await cacheCoverToR2(metadata.coverUrl, objectPath)
        if (cached) {
          coverStoragePath = cached.coverStoragePath
          coverUrl = cached.coverUrl
        }
      }

      const row: Record<string, unknown> = {
        title: metadata.title,
        type: metadata.type || 'album',
        release_date: metadata.release_date,
        description: metadata.description,
        artists: metadata.artists,
        streaming_links: metadata.streaming_links,
        tracks: metadata.tracks && metadata.tracks.length > 0 ? metadata.tracks : [],
        cover_storage_path: coverStoragePath,
        cover_url: coverUrl,
        display_order: displayOrder,
        active: true,
        manually_edited: false,
        [idField]: externalId,
      }

      if (metadata.itunes_id) row.itunes_id = metadata.itunes_id
      if (metadata.spotify_id) row.spotify_id = metadata.spotify_id
      if (metadata.discogs_id) row.discogs_id = metadata.discogs_id

      const { error: insertError } = await supabase.from('releases').insert(row)
      if (insertError) {
        result.errors.push(`Failed to insert "${metadata.title}": ${insertError.message}`)
      } else {
        result.synced++
        displayOrder++
        existingIds.add(externalId)
      }
    }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    return result
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
      errors: ['Spotify API credentials missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET on the server.'],
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