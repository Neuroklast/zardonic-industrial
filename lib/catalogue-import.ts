import type { createAdminClient } from '@/lib/supabaseAdmin'
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
  displayOrderStart?: number
}

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

export interface ImportCatalogueBatchResult extends BulkExternalSyncResult {
  nextCursor: number
  nextDisplayOrder: number
  done: boolean
}

/**
 * Import a slice of catalogue items into Supabase releases.
 * Used by sync jobs (lightImport) and legacy bulk server actions.
 */
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
  } = options

  const result: ImportCatalogueBatchResult = {
    synced: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    nextCursor: cursor,
    nextDisplayOrder: options.displayOrderStart ?? 0,
    done: true,
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

    const { data: titleMatches, error: titleError } = await supabase
      .from('releases')
      .select(existingSelect)
      .ilike('title', metadata.title)
      .limit(2)

    if (titleError) {
      result.errors.push(`Failed to match "${metadata.title}": ${titleError.message}`)
      result.skipped++
      continue
    }

    if ((titleMatches ?? []).length === 1) {
      await applyBulkBackfillToExistingRelease(
        supabase,
        titleMatches![0] as ExistingReleaseBackfillRow,
        metadata,
        source,
        idField,
        externalId,
        result,
      )
      existingIds.add(externalId)
      continue
    }

    if ((titleMatches ?? []).length > 1) {
      result.errors.push(`Ambiguous title match for "${metadata.title}" — skipped`)
      result.skipped++
      continue
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
      cover_storage_path: null,
      cover_url: metadata.coverUrl,
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

  result.nextCursor = cursor + slice.length
  result.nextDisplayOrder = displayOrder
  result.done = result.nextCursor >= items.length
  return result
}