import type { createAdminClient } from '@/lib/supabaseAdmin'
import {
  addReleaseToMatchIndex,
  buildReleaseMatchIndex,
  dedupeCatalogueImportItems,
  findExistingReleaseForImport,
  type ReleaseConsolidationRow,
  type ReleaseMatchIndex,
} from '@/lib/release-consolidation'
import {
  buildTrackEnrichmentUpdate,
  releaseTracksAreEmpty,
  type TracksSource,
} from '@/lib/release-enrichment'
import { fetchReleaseMetadataFromDiscogs } from '@/lib/discogs-sync'
import { fetchReleaseMetadataFromSpotify } from '@/lib/spotify-sync'
import type { ExternalReleaseSource } from '@/lib/release-external-ids'
import {
  mergeStreamingLinks,
  type ReleaseMetadata,
  type StreamingLink,
} from '@/lib/release-metadata'
import {
  extractItunesAlbumIdFromLinks,
  extractSpotifyAlbumIdFromLinks,
  fetchOdesliStreamingLinks,
  mergeOdesliIntoReleaseLinks,
} from '@/lib/release-streaming-enrichment'

export interface BulkExternalSyncResult {
  synced: number
  updated: number
  skipped: number
  errors: string[]
}

export interface CatalogueImportItem {
  externalId: string
  metadata: ReleaseMetadata
}

export interface ImportCatalogueBatchOptions {
  source: ExternalReleaseSource
  idField: 'itunes_id' | 'spotify_id' | 'discogs_id'
  items: CatalogueImportItem[]
  cursor: number
  limit: number
  /** Skip per-item API enrichment, Odesli, and R2 — faster chunks for async jobs. */
  lightImport?: boolean
  existingIds?: Set<string>
  releaseMatchIndex?: ReleaseMatchIndex
  displayOrderStart?: number
  /** Resolve missing Spotify/iTunes ids via Odesli when backfilling cross-source rows. */
  linkCrossSource?: boolean
  cacheCover?: (
    coverUrl: string,
    source: ExternalReleaseSource,
    externalId: string,
  ) => Promise<{ cover_storage_path: string; cover_url: string } | null>
}

const RELEASE_MATCH_SELECT =
  'id, title, type, release_date, description, artists, streaming_links, tracks, tracks_source, last_enriched_at, cover_storage_path, cover_url, display_order, active, manually_edited, itunes_id, spotify_id, discogs_id'

interface ExistingReleaseBackfillRow {
  id: string
  tracks: unknown
  streaming_links: unknown
  manually_edited: boolean | null
  itunes_id?: string | null
  spotify_id?: string | null
  discogs_id?: string | null
}

function buildBulkBackfillUpdate(
  existingRow: ExistingReleaseBackfillRow,
  metadata: ReleaseMetadata,
  source: ExternalReleaseSource,
  idField: 'itunes_id' | 'spotify_id' | 'discogs_id',
  externalId: string,
): Record<string, unknown> | null {
  const update: Record<string, unknown> = {}
  let changed = false

  if (idField === 'spotify_id') {
    if (!existingRow.spotify_id) {
      update.spotify_id = externalId
      changed = true
    }
  } else if (idField === 'itunes_id') {
    if (!existingRow.itunes_id) {
      update.itunes_id = externalId
      changed = true
    }
  } else if (idField === 'discogs_id') {
    if (!existingRow.discogs_id) {
      update.discogs_id = externalId
      changed = true
    }
  }

  if (!existingRow.spotify_id && metadata.spotify_id) {
    update.spotify_id = metadata.spotify_id
    changed = true
  }
  if (!existingRow.itunes_id && metadata.itunes_id) {
    update.itunes_id = metadata.itunes_id
    changed = true
  }
  if (!existingRow.discogs_id && metadata.discogs_id) {
    update.discogs_id = metadata.discogs_id
    changed = true
  }

  const existingLinks = Array.isArray(existingRow.streaming_links)
    ? (existingRow.streaming_links as StreamingLink[])
    : []
  const mergedLinks = mergeStreamingLinks(existingLinks, metadata.streaming_links)
  if (mergedLinks.length > existingLinks.length) {
    update.streaming_links = mergedLinks
    changed = true
  }

  const linkedSpotifyId =
    metadata.spotify_id ?? extractSpotifyAlbumIdFromLinks(mergedLinks)
  const linkedItunesId = metadata.itunes_id ?? extractItunesAlbumIdFromLinks(mergedLinks)

  if (!existingRow.spotify_id && linkedSpotifyId) {
    update.spotify_id = linkedSpotifyId
    changed = true
  }
  if (!existingRow.itunes_id && linkedItunesId) {
    update.itunes_id = linkedItunesId
    changed = true
  }

  if (
    releaseTracksAreEmpty(existingRow.tracks) &&
    metadata.tracks &&
    metadata.tracks.length > 0 &&
    (source === 'spotify' || source === 'discogs')
  ) {
    Object.assign(update, buildTrackEnrichmentUpdate(metadata.tracks, source as TracksSource))
    changed = true
  }

  return changed ? update : null
}

async function applyBulkBackfillToExistingRelease(
  supabase: ReturnType<typeof createAdminClient>,
  existingRow: ExistingReleaseBackfillRow,
  metadata: ReleaseMetadata,
  source: ExternalReleaseSource,
  idField: 'itunes_id' | 'spotify_id' | 'discogs_id',
  externalId: string,
  result: BulkExternalSyncResult,
): Promise<void> {
  const update = buildBulkBackfillUpdate(existingRow, metadata, source, idField, externalId)
  if (!update) {
    result.skipped++
    return
  }

  const { error: updateError } = await supabase
    .from('releases')
    .update(update)
    .eq('id', existingRow.id)

  if (updateError) {
    result.errors.push(`Failed to update "${metadata.title}": ${updateError.message}`)
    result.skipped++
    return
  }

  result.updated++
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

async function linkCrossSourceMetadata(
  source: ExternalReleaseSource,
  metadata: ReleaseMetadata,
  existingRow: ExistingReleaseBackfillRow | null,
  options: { lightImport: boolean; linkCrossSource: boolean },
): Promise<ReleaseMetadata> {
  if (!options.linkCrossSource) return metadata

  const existingSpotifyId = existingRow?.spotify_id ?? null
  const existingItunesId = existingRow?.itunes_id ?? null
  const needsSpotify =
    (source === 'itunes' || existingItunesId) && !metadata.spotify_id && !existingSpotifyId
  const needsItunes =
    (source === 'spotify' || existingSpotifyId) && !metadata.itunes_id && !existingItunesId

  if (!needsSpotify && !needsItunes) return metadata

  if (!options.lightImport) return metadata

  const odesliLinks = await fetchOdesliStreamingLinks({
    itunes_id: metadata.itunes_id ?? existingItunesId,
    spotify_id: metadata.spotify_id ?? existingSpotifyId,
    streaming_links: metadata.streaming_links,
  })
  if (odesliLinks.length === 0) return metadata

  const mergedLinks = mergeOdesliIntoReleaseLinks(metadata.streaming_links, odesliLinks)
  return {
    ...metadata,
    streaming_links: mergedLinks,
    spotify_id: metadata.spotify_id ?? extractSpotifyAlbumIdFromLinks(mergedLinks),
    itunes_id: metadata.itunes_id ?? extractItunesAlbumIdFromLinks(mergedLinks),
  }
}

export type ReleaseMatchEntry = Pick<
  ReleaseConsolidationRow,
  | 'id'
  | 'title'
  | 'type'
  | 'release_date'
  | 'spotify_id'
  | 'itunes_id'
  | 'discogs_id'
  | 'manually_edited'
>

export interface ImportCatalogueBatchResult extends BulkExternalSyncResult {
  nextCursor: number
  nextDisplayOrder: number
  done: boolean
  addedMatchEntries: ReleaseMatchEntry[]
}

export function toReleaseMatchEntry(row: ReleaseConsolidationRow): ReleaseMatchEntry {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    release_date: row.release_date,
    spotify_id: row.spotify_id,
    itunes_id: row.itunes_id,
    discogs_id: row.discogs_id,
    manually_edited: row.manually_edited,
  }
}

/**
 * Import a slice of catalogue items into Supabase releases.
 * Used by sync jobs (lightImport) and legacy bulk server actions.
 */
export async function importCatalogueItems(
  supabase: ReturnType<typeof createAdminClient>,
  options: Omit<ImportCatalogueBatchOptions, 'cursor' | 'limit'> & { items: CatalogueImportItem[] },
): Promise<ImportCatalogueBatchResult> {
  const deduped = dedupeCatalogueImportItems(options.items)
  return importCatalogueBatch(supabase, {
    ...options,
    items: deduped,
    cursor: 0,
    limit: deduped.length,
  })
}

export async function importCatalogueBatch(
  supabase: ReturnType<typeof createAdminClient>,
  options: ImportCatalogueBatchOptions,
): Promise<ImportCatalogueBatchResult> {
  const {
    source,
    idField,
    items,
    cursor,
    limit,
    lightImport = false,
    linkCrossSource = true,
  } = options

  const result: ImportCatalogueBatchResult = {
    synced: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    nextCursor: cursor,
    nextDisplayOrder: options.displayOrderStart ?? 0,
    done: true,
    addedMatchEntries: [],
  }

  const slice = items.slice(cursor, cursor + limit)
  if (slice.length === 0) {
    result.done = cursor >= items.length
    return result
  }

  let existingIds = options.existingIds
  if (!existingIds) {
    const { data: existingRows } = await supabase
      .from('releases')
      .select(`title, ${idField}`)
      .not(idField, 'is', null)

    existingIds = new Set(
      (existingRows ?? [])
        .map((row: Record<string, string | null>) => row[idField])
        .filter((id: string | null | undefined): id is string => Boolean(id)),
    )
  }

  let releaseMatchIndex = options.releaseMatchIndex
  if (!releaseMatchIndex) {
    const { data: matchRows, error: matchError } = await supabase
      .from('releases')
      .select(RELEASE_MATCH_SELECT)

    if (matchError) {
      result.errors.push(`Failed to load releases for duplicate matching: ${matchError.message}`)
      return result
    }

    releaseMatchIndex = buildReleaseMatchIndex((matchRows ?? []) as ReleaseConsolidationRow[])
  }

  let displayOrder = options.displayOrderStart
  if (displayOrder === undefined) {
    const { data: maxRow } = await supabase
      .from('releases')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    displayOrder = ((maxRow as { display_order?: number } | null)?.display_order ?? -1) + 1
  }

  const existingSelect =
    'id, tracks, streaming_links, manually_edited, itunes_id, spotify_id, discogs_id'

  for (const { externalId, metadata: baseMetadata } of slice) {
    let metadata = baseMetadata
    if (!lightImport) {
      metadata = await enrichMetadataForBulkImport(source, externalId, baseMetadata)
      const odesliLinks = await fetchOdesliStreamingLinks({
        itunes_id: metadata.itunes_id,
        spotify_id: metadata.spotify_id,
        streaming_links: metadata.streaming_links,
      })
      if (odesliLinks.length > 0) {
        metadata.streaming_links = mergeOdesliIntoReleaseLinks(metadata.streaming_links, odesliLinks)
        metadata.spotify_id = metadata.spotify_id ?? extractSpotifyAlbumIdFromLinks(metadata.streaming_links)
        metadata.itunes_id = metadata.itunes_id ?? extractItunesAlbumIdFromLinks(metadata.streaming_links)
      }
    }

    if (existingIds.has(externalId)) {
      const { data: existingRow, error: existingError } = await supabase
        .from('releases')
        .select(existingSelect)
        .eq(idField, externalId)
        .maybeSingle()

      if (existingError || !existingRow) {
        result.errors.push(
          `Failed to load existing "${metadata.title}": ${existingError?.message ?? 'not found'}`,
        )
        result.skipped++
        continue
      }

      metadata = await linkCrossSourceMetadata(
        source,
        metadata,
        existingRow as ExistingReleaseBackfillRow,
        { lightImport, linkCrossSource },
      )

      await applyBulkBackfillToExistingRelease(
        supabase,
        existingRow as ExistingReleaseBackfillRow,
        metadata,
        source,
        idField,
        externalId,
        result,
      )
      continue
    }

    const matchedRelease = findExistingReleaseForImport(metadata, releaseMatchIndex)
    if (matchedRelease) {
      const { data: existingRow, error: existingError } = await supabase
        .from('releases')
        .select(existingSelect)
        .eq('id', matchedRelease.id)
        .maybeSingle()

      if (existingError || !existingRow) {
        result.errors.push(
          `Failed to load matched "${metadata.title}": ${existingError?.message ?? 'not found'}`,
        )
        result.skipped++
        continue
      }

      metadata = await linkCrossSourceMetadata(
        source,
        metadata,
        existingRow as ExistingReleaseBackfillRow,
        { lightImport, linkCrossSource },
      )

      await applyBulkBackfillToExistingRelease(
        supabase,
        existingRow as ExistingReleaseBackfillRow,
        metadata,
        source,
        idField,
        externalId,
        result,
      )
      existingIds.add(externalId)
      continue
    }

    let coverStoragePath: string | null = null
    let coverUrl: string | null = metadata.coverUrl
    if (metadata.coverUrl && options.cacheCover) {
      const cached = await options.cacheCover(metadata.coverUrl, source, externalId)
      if (cached) {
        coverStoragePath = cached.cover_storage_path
        coverUrl = cached.cover_url
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
      tracks_source:
        metadata.tracks && metadata.tracks.length > 0 && (source === 'spotify' || source === 'discogs')
          ? source
          : null,
      last_enriched_at:
        metadata.tracks && metadata.tracks.length > 0 ? new Date().toISOString() : null,
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

    const { data: insertedRow, error: insertError } = await supabase
      .from('releases')
      .insert(row)
      .select(RELEASE_MATCH_SELECT)
      .maybeSingle()

    if (insertError) {
      result.errors.push(`Failed to insert "${metadata.title}": ${insertError.message}`)
    } else {
      result.synced++
      displayOrder++
      existingIds.add(externalId)
      if (insertedRow) {
        const consolidationRow = insertedRow as ReleaseConsolidationRow
        addReleaseToMatchIndex(releaseMatchIndex, consolidationRow)
        result.addedMatchEntries.push(toReleaseMatchEntry(consolidationRow))
      }
    }
  }

  result.nextCursor = cursor + slice.length
  result.nextDisplayOrder = displayOrder
  result.done = result.nextCursor >= items.length
  return result
}