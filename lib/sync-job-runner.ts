import { getApiSecret } from '@/lib/api-secrets'
import {
  resolveBandsintownArtistName,
  syncBandsintownGigsToSupabase,
} from '@/lib/bandsintown-sync'
import {
  parseCatalogueSyncConfig,
  type CatalogueSyncConfig,
} from '@/lib/catalogue-sync-config'
import {
  importCatalogueBatch,
  type CatalogueImportItem,
} from '@/lib/catalogue-import'
import { fetchDiscogsArtistReleasesPage, searchDiscogsArtistId } from '@/lib/discogs-sync'
import {
  buildReleaseEnrichmentUpdate,
  releaseNeedsEnrichment,
  type ReleaseEnrichmentRow,
} from '@/lib/release-enrichment'
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
} from '@/lib/sync-jobs'

const IMPORT_BATCH_SIZE = 10
const ENRICH_BATCH_SIZE = 15

const ENRICHMENT_SELECT =
  'id, title, tracks, manually_edited, spotify_id, discogs_id, itunes_id, tracks_source, last_enriched_at, streaming_links'

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
  source: 'spotify' | 'discogs',
  payload: SyncJobPayload,
): Promise<SyncJobPayload> {
  if (payload.artistId != null) return { ...payload, source }

  const config = await loadCatalogueSyncConfig()
  const artistName = (payload.artistName?.trim() || config.artistName).trim()

  if (source === 'spotify') {
    const artistId = await resolveSpotifyArtistId(config, artistName)
    if (!artistId) throw new Error('Spotify artist ID or name not configured')
    const token = await getSpotifyAccessToken()
    if (!token) throw new Error('Spotify API credentials missing')
    return { ...payload, source, artistName, artistId }
  }

  const artistId = await resolveDiscogsArtistId(config, artistName)
  if (!artistId) throw new Error('Discogs artist ID or name not configured')
  const token = await getApiSecret('discogs_token')
  if (!token) throw new Error('Discogs token missing')
  return { ...payload, source, artistName, artistId }
}

async function tickFetchPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
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
      const updated = await updateSyncJob(job.id, {
        status: 'running',
        phase: 'import',
        payload: nextPayload,
        progress: mergeProgress(job.progress, {
          total: stagedItems.length,
          processed: stagedItems.length,
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
    throw new Error('Spotify album fetch failed')
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
    const updated = await updateSyncJob(job.id, {
      status: 'running',
      phase: 'import',
      payload: nextPayload,
      progress: mergeProgress(job.progress, {
        total: stagedItems.length,
        processed: stagedItems.length,
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

async function tickImportPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const payload = job.payload
  const source = payload.source ?? (job.type === 'discogs_sync' ? 'discogs' : 'spotify')
  const idField = source === 'discogs' ? 'discogs_id' : 'spotify_id'
  const items = payload.stagedItems ?? []
  const cursor = payload.importCursor ?? 0

  const supabase = createAdminClient()
  const existingIds = payload.existingIds
    ? new Set(payload.existingIds)
    : undefined

  const batch = await importCatalogueBatch(supabase, {
    source,
    idField,
    items,
    cursor,
    limit: IMPORT_BATCH_SIZE,
    lightImport: true,
    existingIds,
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

  if (job.type === 'purge_and_sync_releases') {
    nextPayload.enrichCursor = 0
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
    phase: 'import',
    payload: nextPayload,
    progress: nextProgress,
    completed_at: new Date().toISOString(),
  })
  return { job: updated, done: true }
}

async function tickEnrichPhase(job: SyncJobRow): Promise<AdvanceSyncJobResult> {
  const supabase = createAdminClient()
  const config = await loadCatalogueSyncConfig()
  const artistName = config.artistName || 'Zardonic'
  const cursor = job.payload.enrichCursor ?? 0

  const { data: rows, error: listError } = await supabase
    .from('releases')
    .select(ENRICHMENT_SELECT)
    .eq('manually_edited', false)
    .order('display_order', { ascending: true })

  if (listError) throw new Error(listError.message)

  const candidates = (rows ?? []).filter((row: ReleaseEnrichmentRow) =>
    releaseNeedsEnrichment(row),
  )
  const batch = candidates.slice(cursor, cursor + ENRICH_BATCH_SIZE)

  let enriched = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of batch) {
    const release = row as ReleaseEnrichmentRow
    const update = await buildReleaseEnrichmentUpdate(release, artistName)
    if (!update) {
      skipped++
      errors.push(`"${release.title}": no data from external APIs`)
      continue
    }

    const { error: updateError } = await supabase.from('releases').update(update).eq('id', release.id)
    if (updateError) {
      skipped++
      errors.push(`"${release.title}": ${updateError.message}`)
      continue
    }
    enriched++
  }

  const nextCursor = cursor + batch.length
  const done = nextCursor >= candidates.length
  const nextProgress = mergeProgress(job.progress, {
    processed: nextCursor,
    total: candidates.length,
    synced: enriched,
    skipped,
    errors,
  })

  const nextPayload: SyncJobPayload = {
    ...job.payload,
    enrichCursor: nextCursor,
  }

  if (!done) {
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
      phase: 'sync',
      payload: { ...job.payload, purgeDeleted: count ?? 0 },
      progress: mergeProgress(job.progress, {
        errors: [`Purged ${count ?? 0} gig(s)`],
      }),
    })
    return { job: updated, done: false }
  }

  const apiKey = await getApiSecret('bandsintown_api_key')
  if (!apiKey) throw new Error('Bandsintown API key is not configured')

  const artistName = await resolveBandsintownArtistName(supabase)
  const syncResult = await syncBandsintownGigsToSupabase(supabase, artistName, apiKey)

  const updated = await updateSyncJob(job.id, {
    status: 'completed',
    phase: 'sync',
    payload: job.payload,
    progress: mergeProgress(job.progress, {
      synced: syncResult.synced,
      updated: syncResult.updated,
      skipped: syncResult.skipped,
      errors: syncResult.errors,
      processed: syncResult.synced + syncResult.updated + syncResult.skipped,
    }),
    completed_at: new Date().toISOString(),
  })
  return { job: updated, done: true }
}

/** Process one chunk of a sync job. */
export async function advanceSyncJob(jobId: string): Promise<AdvanceSyncJobResult> {
  const job = await getSyncJob(jobId)
  if (!job) throw new Error('Sync job not found')
  if (job.status === 'cancelled' || job.status === 'completed' || job.status === 'failed') {
    return { job, done: true }
  }

  try {
    if (job.status === 'pending') {
      await updateSyncJob(jobId, { status: 'running' })
    }

    const current = (await getSyncJob(jobId))!

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync job failed'
    const failed = await updateSyncJob(jobId, {
      status: 'failed',
      progress: mergeProgress(job.progress, { errors: [message] }),
      completed_at: new Date().toISOString(),
    })
    return { job: failed, done: true }
  }
}