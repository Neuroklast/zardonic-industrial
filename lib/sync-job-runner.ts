import { getApiSecret } from '@/lib/api-secrets'
import {
  fetchBandsintownEventsFromApi,
  mapBandsintownEventToGigRow,
  resolveBandsintownArtistName,
  syncBandsintownGigsBatch,
  type BandsintownGigRow,
} from '@/lib/bandsintown-sync'
import { buildItunesCatalogueImportItems } from '@/lib/itunes-sync'
import { normalizeItunesArtistId } from '@/lib/release-external-ids'
import {
  parseCatalogueSyncConfig,
  type CatalogueSyncConfig,
} from '@/lib/catalogue-sync-config'
import {
  importCatalogueBatch,
  type CatalogueImportItem,
} from '@/lib/catalogue-import'
import {
  buildReleaseMatchIndex,
  consolidateDuplicateReleases,
  dedupeCatalogueImportItems,
  type ReleaseConsolidationRow,
} from '@/lib/release-consolidation'
import { fetchDiscogsArtistReleasesPage, searchDiscogsArtistId } from '@/lib/discogs-sync'
import { runCatalogueEnrichmentBatch } from '@/lib/release-enrichment'
import {
  normalizeDiscogsArtistId,
  normalizeSpotifyArtistId,
} from '@/lib/release-external-ids'
import { getSpotifyAccessToken } from '@/lib/spotify-client'
import {
  fetchSpotifyArtistAlbumsPage,
  searchSpotifyArtistId,
} from '@/lib/spotify-sync'
import { createAdminClient } from '@/lib/supabaseAdmin'
import {
  getSyncJob,
  updateSyncJob,
  type SyncJobPayload,
  type SyncJobProgress,
  type SyncJobRow,
  type SyncJobType,
} from '@/lib/sync-jobs'

const IMPORT_BATCH_SIZE = 8
const ENRICH_BATCH_SIZE = 5

const CATALOGUE_IMPORT_JOB_TYPES = new Set<SyncJobType>([
  'itunes_sync',
  'spotify_sync',
  'discogs_sync',
  'purge_and_sync_releases',
])

function shouldEnrichAfterCatalogueImport(type: SyncJobType): boolean {
  return CATALOGUE_IMPORT_JOB_TYPES.has(type)
}
const PROCESSING_STALE_MS = 120_000

export interface AdvanceSyncJobResult {
  job: SyncJobRow
  done: boolean
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

function mergeProgress(
  current: SyncJobProgress,
  delta: Partial<SyncJobProgress>,
): SyncJobProgress {
  return {
    processed: delta.processed ?? current.processed,
    total: delta.total !== undefined ? delta.total : current.total,
    synced: current.synced + (delta.synced ?? 0),
    updated: current.updated + (delta.updated ?? 0),
    skipped: current.skipped + (delta.skipped ?? 0),
    errors: [...current.errors, ...(delta.errors ?? [])],
  }
}

async function resolveSpotifyArtistId(
  config: CatalogueSyncConfig,
  artistName: string,
): Promise<string | null> {
  const configuredId = normalizeSpotifyArtistId(config.spotifyArtistId)
  if (configuredId) return configuredId
  if (!artistName) return null
  return searchSpotifyArtistId(artistName)
}

async function resolveDiscogsArtistId(
  config: CatalogueSyncConfig,
  artistName: string,
): Promise<number | null> {
  const configuredId = normalizeDiscogsArtistId(config.discogsArtistId)
  if (configuredId) {
    const parsed = Number.parseInt(configuredId, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (!artistName) return null
  return searchDiscogsArtistId(artistName)
}

async function initCataloguePayload(
  source: 'spotify' | 'discogs' | 'itunes',
  payload: SyncJobPayload,
): Promise<SyncJobPayload> {
  const config = await loadCatalogueSyncConfig()
  const artistName = (payload.artistName?.trim() || config.artistName).trim()

  if (source === 'spotify') {
    const artistId =
      payload.artistId != null
        ? String(payload.artistId)
        : await resolveSpotifyArtistId(config, artistName)
    if (!artistId) throw new Error('Spotify artist ID or name not configured')
    const token = await getSpotifyAccessToken()
    if (!token) throw new Error('Spotify API credentials missing')
    return { ...payload, source, artistName, artistId }
  }

  if (payload.artistId != null) return { ...payload, source }

  const artistId = await resolveDiscogsArtistId(config, artistName)
  if (!artistId) throw new Error('Discogs artist ID or name not configured')
  const token = await getApiSecret('discogs_token')
  if (!token) throw new Error('Discogs token missing')
  return { ...payload, source, artistName, artistId }
}

async function tickItunesFetchPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const config = await loadCatalogueSyncConfig()
  const artistName = (job.payload.artistName?.trim() || config.artistName).trim()
  const itunesArtistId = normalizeItunesArtistId(config.itunesArtistId)

  if (!artistName && !itunesArtistId) {
    throw new Error('Configure an artist name or iTunes artist ID in Catalogue Sync settings')
  }

  const { items, errors } = await buildItunesCatalogueImportItems({ artistName, itunesArtistId })
  const nextPayload: SyncJobPayload = {
    ...job.payload,
    source: 'itunes',
    artistName,
    stagedItems: dedupeCatalogueImportItems(items),
    importCursor: 0,
  }

  const updated = await updateSyncJob(job.id, {
    status: 'running',
    phase: 'import',
    payload: nextPayload,
    progress: mergeProgress(job.progress, {
      total: items.length,
      processed: 0,
      errors,
    }),
  })
  return { job: updated, done: false }
}

async function tickFetchPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  if (job.type === 'itunes_sync') {
    return tickItunesFetchPhase(job)
  }

  const payload = await initCataloguePayload(job.payload.source ?? 'spotify', job.payload)
  const stagedItems: CatalogueImportItem[] = [...(payload.stagedItems ?? [])]

  if (payload.source === 'discogs') {
    const artistId = Number(payload.artistId)
    const page = payload.fetchPage ?? 1
    const pageResult = await fetchDiscogsArtistReleasesPage(artistId, page)
    if (!pageResult.ok) {
      throw new Error(`Discogs fetch failed on page ${page}`)
    }

    for (const item of pageResult.items) {
      stagedItems.push({ externalId: item.discogs_id, metadata: item.metadata })
    }

    const fetchDone = page >= pageResult.totalPages
    const nextPayload: SyncJobPayload = {
      ...payload,
      stagedItems,
      fetchPage: fetchDone ? page : page + 1,
      fetchTotalPages: pageResult.totalPages,
      importCursor: payload.importCursor ?? 0,
      existingIds: payload.existingIds,
      displayOrderStart: payload.displayOrderStart,
    }

    if (fetchDone) {
      nextPayload.stagedItems = dedupeCatalogueImportItems(stagedItems)
      const updated = await updateSyncJob(job.id, {
        status: 'running',
        phase: 'import',
        payload: nextPayload,
        progress: mergeProgress(job.progress, {
          total: nextPayload.stagedItems.length,
          processed: nextPayload.stagedItems.length,
        }),
      })
      return { job: updated, done: false }
    }

    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'fetch',
      payload: nextPayload,
      progress: mergeProgress(job.progress, {
        processed: stagedItems.length,
        total: pageResult.totalPages * 100,
      }),
    })
    return { job: updated, done: false }
  }

  const artistId = String(payload.artistId)
  const pageResult = await fetchSpotifyArtistAlbumsPage(artistId, payload.fetchNextUrl ?? null)
  if (!pageResult.ok) {
    throw new Error(pageResult.error ?? 'Spotify album fetch failed')
  }

  for (const item of pageResult.items) {
    stagedItems.push({ externalId: item.spotify_id, metadata: item.metadata })
  }

  const fetchDone = !pageResult.nextUrl
  const nextPayload: SyncJobPayload = {
    ...payload,
    stagedItems,
    fetchNextUrl: pageResult.nextUrl,
    importCursor: payload.importCursor ?? 0,
    existingIds: payload.existingIds,
    displayOrderStart: payload.displayOrderStart,
  }

  if (fetchDone) {
    nextPayload.stagedItems = dedupeCatalogueImportItems(stagedItems)
    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'import',
      payload: nextPayload,
      progress: mergeProgress(job.progress, {
        total: nextPayload.stagedItems.length,
        processed: nextPayload.stagedItems.length,
      }),
    })
    return { job: updated, done: false }
  }

  const updated = await updateSyncJob(job.id, {
    status: 'running',
    phase: 'fetch',
    payload: nextPayload,
    progress: mergeProgress(job.progress, {
      processed: stagedItems.length,
    }),
  })
  return { job: updated, done: false }
}

async function loadReleaseMatchIndex(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from('releases')
    .select(
      'id, title, type, release_date, spotify_id, itunes_id, discogs_id, manually_edited',
    )

  if (error) throw new Error(`Failed to load releases for duplicate matching: ${error.message}`)
  return buildReleaseMatchIndex((data ?? []) as ReleaseConsolidationRow[])
}

async function runPostImportConsolidation(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ updated: number; errors: string[] }> {
  const result = await consolidateDuplicateReleases(supabase)
  const errors = [...result.errors]
  if (result.deleted > 0) {
    errors.unshift(
      `Consolidated ${result.deleted} duplicate release(s) across iTunes/Spotify/Discogs`,
    )
  }
  return { updated: result.deleted, errors }
}

async function tickImportPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const payload = job.payload
  const source =
    payload.source ??
    (job.type === 'discogs_sync' ? 'discogs' : job.type === 'itunes_sync' ? 'itunes' : 'spotify')
  const idField =
    source === 'discogs' ? 'discogs_id' : source === 'itunes' ? 'itunes_id' : 'spotify_id'
  const items = payload.stagedItems ?? []
  const cursor = payload.importCursor ?? 0

  const supabase = createAdminClient()
  const existingIds = payload.existingIds
    ? new Set(payload.existingIds)
    : undefined
  const releaseMatchIndex = await loadReleaseMatchIndex(supabase)

  const batch = await importCatalogueBatch(supabase, {
    source,
    idField,
    items,
    cursor,
    limit: IMPORT_BATCH_SIZE,
    lightImport: true,
    linkCrossSource: true,
    existingIds,
    releaseMatchIndex,
    displayOrderStart: payload.displayOrderStart,
  })

  const nextExistingIds = existingIds ?? new Set<string>()
  for (const item of items.slice(cursor, batch.nextCursor)) {
    nextExistingIds.add(item.externalId)
  }

  const nextPayload: SyncJobPayload = {
    ...payload,
    importCursor: batch.nextCursor,
    existingIds: [...nextExistingIds],
    displayOrderStart: batch.nextDisplayOrder,
  }

  const nextProgress = mergeProgress(job.progress, {
    processed: batch.nextCursor,
    synced: batch.synced,
    updated: batch.updated,
    skipped: batch.skipped,
    errors: batch.errors,
    total: items.length,
  })

  if (!batch.done) {
    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'import',
      payload: nextPayload,
      progress: nextProgress,
    })
    return { job: updated, done: false }
  }

  const consolidation = await runPostImportConsolidation(supabase)
  const progressAfterConsolidation = mergeProgress(nextProgress, {
    updated: nextProgress.updated + consolidation.updated,
    errors: consolidation.errors,
  })

  if (shouldEnrichAfterCatalogueImport(job.type)) {
    nextPayload.enrichCursor = 0
    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'enrich',
      payload: nextPayload,
      progress: progressAfterConsolidation,
    })
    return { job: updated, done: false }
  }

  const updated = await updateSyncJob(job.id, {
    status: 'completed',
    phase: 'import',
    payload: nextPayload,
    progress: progressAfterConsolidation,
    completed_at: new Date().toISOString(),
  })
  return { job: updated, done: true }
}

async function tickEnrichPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const supabase = createAdminClient()
  const config = await loadCatalogueSyncConfig()
  const artistName = config.artistName || 'Zardonic'
  const cursor = job.payload.enrichCursor ?? 0

  const batchResult = await runCatalogueEnrichmentBatch(supabase, {
    artistName,
    cursor,
    limit: ENRICH_BATCH_SIZE,
  })

  const nextProgress = mergeProgress(job.progress, {
    processed: batchResult.nextCursor,
    total: batchResult.total,
    synced: batchResult.enriched,
    skipped: batchResult.skipped,
    errors: batchResult.errors,
  })

  const nextPayload: SyncJobPayload = {
    ...job.payload,
    enrichCursor: batchResult.nextCursor,
  }

  if (!batchResult.done) {
    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'enrich',
      payload: nextPayload,
      progress: nextProgress,
    })
    return { job: updated, done: false }
  }

  const updated = await updateSyncJob(job.id, {
    status: 'completed',
    phase: 'enrich',
    payload: nextPayload,
    progress: nextProgress,
    completed_at: new Date().toISOString(),
  })
  return { job: updated, done: true }
}

async function tickPurgeAndSyncReleases(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('releases')
    .delete({ count: 'exact' })
    .eq('manually_edited', false)

  if (error) throw new Error(error.message)

  const config = await loadCatalogueSyncConfig()
  const artistName = config.artistName.trim()
  const nextPayload: SyncJobPayload = {
    source: 'spotify',
    artistName,
    stagedItems: [],
    importCursor: 0,
    purgeDeleted: count ?? 0,
  }

  const updated = await updateSyncJob(job.id, {
    status: 'running',
    phase: 'fetch',
    payload: nextPayload,
    progress: mergeProgress(job.progress, {
      errors: [`Purged ${count ?? 0} auto-synced release(s)`],
    }),
  })
  return { job: updated, done: false }
}

async function tickBandsintownFetchPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const supabase = createAdminClient()
  const apiKey = await getApiSecret('bandsintown_api_key')
  if (!apiKey) throw new Error('Bandsintown API key is not configured')

  const artistName = await resolveBandsintownArtistName(supabase)
  const rawEvents = await fetchBandsintownEventsFromApi(artistName, apiKey, true)
  const stagedGigs = rawEvents
    .map(mapBandsintownEventToGigRow)
    .filter((row): row is BandsintownGigRow => row !== null)

  const updated = await updateSyncJob(job.id, {
    status: 'running',
    phase: 'import',
    payload: {
      ...job.payload,
      artistName,
      stagedGigs,
      gigImportCursor: 0,
    },
    progress: mergeProgress(job.progress, {
      total: stagedGigs.length,
      processed: 0,
    }),
  })
  return { job: updated, done: false }
}

async function tickBandsintownImportPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const supabase = createAdminClient()
  const stagedGigs = job.payload.stagedGigs ?? []
  const cursor = job.payload.gigImportCursor ?? 0
  const batch = await syncBandsintownGigsBatch(supabase, stagedGigs, cursor)

  const nextProgress = mergeProgress(job.progress, {
    processed: batch.nextCursor,
    total: stagedGigs.length,
    synced: batch.synced,
    updated: batch.updated,
    skipped: batch.skipped,
    errors: batch.errors,
  })

  const nextPayload: SyncJobPayload = {
    ...job.payload,
    gigImportCursor: batch.nextCursor,
  }

  if (!batch.done) {
    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'import',
      payload: nextPayload,
      progress: nextProgress,
    })
    return { job: updated, done: false }
  }

  const updated = await updateSyncJob(job.id, {
    status: 'completed',
    phase: 'import',
    payload: nextPayload,
    progress: nextProgress,
    completed_at: new Date().toISOString(),
  })
  return { job: updated, done: true }
}

async function tickPurgeAndSyncGigs(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const phase = job.phase ?? 'purge'
  const supabase = createAdminClient()

  if (phase === 'purge') {
    const { count, error } = await supabase
      .from('gigs')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw new Error(error.message)

    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'fetch',
      payload: { ...job.payload, purgeDeleted: count ?? 0 },
      progress: mergeProgress(job.progress, {
        errors: [`Purged ${count ?? 0} gig(s)`],
      }),
    })
    return { job: updated, done: false }
  }

  if (phase === 'fetch') {
    return tickBandsintownFetchPhase(job)
  }

  return tickBandsintownImportPhase(job)
}

function isProcessingStale(payload: SyncJobPayload): boolean {
  if (!payload.processing) return true
  const since = payload.processingSince ?? 0
  return Date.now() - since > PROCESSING_STALE_MS
}

async function acquireProcessingLock(job: SyncJobRow): Promise<SyncJobRow | null> {
  if (!isProcessingStale(job.payload)) {
    return null
  }

  return updateSyncJob(job.id, {
    payload: {
      ...job.payload,
      processing: true,
      processingSince: Date.now(),
    },
  })
}

async function releaseProcessingLock(job: SyncJobRow): Promise<void> {
  await updateSyncJob(job.id, {
    payload: {
      ...job.payload,
      processing: false,
      processingSince: undefined,
    },
  })
}

async function runSyncJobTick(current: SyncJobRow): Promise<AdvanceSyncJobResult> {
  if (current.type === 'track_enrichment') {
    return tickEnrichPhase(current)
  }

  if (current.type === 'bandsintown_sync') {
    const phase = current.phase ?? 'fetch'
    if (phase === 'fetch') return tickBandsintownFetchPhase(current)
    return tickBandsintownImportPhase(current)
  }

  if (current.type === 'purge_and_sync_gigs') {
    return tickPurgeAndSyncGigs(current)
  }

  if (current.type === 'purge_and_sync_releases' && (current.phase === 'purge' || !current.phase)) {
    return tickPurgeAndSyncReleases(current)
  }

  const phase = current.phase ?? 'fetch'

  if (phase === 'fetch') {
    return tickFetchPhase(current)
  }

  if (phase === 'import') {
    return tickImportPhase(current)
  }

  if (phase === 'enrich') {
    return tickEnrichPhase(current)
  }

  throw new Error(`Unknown sync job phase: ${phase}`)
}

/** Process one chunk of a sync job. */
export async function advanceSyncJob(jobId: string): Promise<AdvanceSyncJobResult> {
  const job = await getSyncJob(jobId)
  if (!job) throw new Error('Sync job not found')
  if (job.status === 'cancelled' || job.status === 'completed' || job.status === 'failed') {
    return { job, done: true }
  }

  const locked = await acquireProcessingLock(job)
  if (!locked) {
    return { job, done: false }
  }

  try {
    if (locked.status === 'pending') {
      await updateSyncJob(jobId, { status: 'running' })
    }

    const current = (await getSyncJob(jobId))!
    const result = await runSyncJobTick(current)
    await releaseProcessingLock(result.job)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync job failed'
    const failed = await updateSyncJob(jobId, {
      status: 'failed',
      payload: {
        ...job.payload,
        processing: false,
        processingSince: undefined,
      },
      progress: mergeProgress(job.progress, { errors: [message] }),
      completed_at: new Date().toISOString(),
    })
    return { job: failed, done: true }
  }
}