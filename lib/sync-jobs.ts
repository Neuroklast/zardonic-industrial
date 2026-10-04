import { createAdminClient } from '@/lib/supabaseAdmin'
import type { CatalogueImportItem } from '@/lib/catalogue-import'
import type { BandsintownGigRow } from '@/lib/bandsintown-sync'

export type SyncJobType =
  | 'discogs_sync'
  | 'spotify_sync'
  | 'itunes_sync'
  | 'track_enrichment'
  | 'bandsintown_sync'
  | 'purge_and_sync_releases'
  | 'purge_and_sync_gigs'

export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type SyncJobPhase = 'purge' | 'fetch' | 'import' | 'enrich' | 'sync'

export interface SyncJobProgress {
  processed: number
  total: number | null
  synced: number
  updated: number
  skipped: number
  errors: string[]
}

export interface SyncJobPayload {
  source?: 'spotify' | 'discogs' | 'itunes'
  artistName?: string
  artistId?: string | number
  fetchPage?: number
  fetchTotalPages?: number
  fetchNextUrl?: string | null
  stagedItems?: CatalogueImportItem[]
  importCursor?: number
  existingIds?: string[]
  displayOrderStart?: number
  enrichCursor?: number
  purgeDeleted?: number
  stagedGigs?: BandsintownGigRow[]
  gigImportCursor?: number
  processing?: boolean
  processingSince?: number
}

export interface SyncJobRow {
  id: string
  type: SyncJobType
  status: SyncJobStatus
  phase: SyncJobPhase | null
  payload: SyncJobPayload
  progress: SyncJobProgress
  created_by: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

/**
 * A sync job without the (potentially multi-MB) `payload` JSONB. `payload`
 * carries the staged catalogue (`stagedItems` / `stagedGigs`) and is only ever
 * needed by the server-side runner — never by the admin UI or the 2 s poller.
 * Reading it out of PostgREST on every poll was a major Supabase egress
 * amplifier (see docs/agent/admin.md).
 */
export type SyncJobSummary = Omit<SyncJobRow, 'payload' | 'created_by'>

/**
 * Columns selected for any job read that must not transfer `payload`.
 * Keep in sync with {@link SyncJobSummary}.
 */
export const SYNC_JOB_SUMMARY_COLUMNS =
  'id, type, status, phase, progress, created_at, updated_at, completed_at' as const

/** Strip the heavy `payload` (and unused `created_by`) from a full job row. */
export function toSyncJobSummary(row: SyncJobRow): SyncJobSummary {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    phase: row.phase,
    progress: row.progress,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
  }
}

const DEFAULT_PROGRESS: SyncJobProgress = {
  processed: 0,
  total: null,
  synced: 0,
  updated: 0,
  skipped: 0,
  errors: [],
}

export async function createSyncJob(
  type: SyncJobType,
  payload: SyncJobPayload,
  createdBy: string | null,
): Promise<SyncJobRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sync_jobs')
    .insert({
      type,
      status: 'pending',
      phase: null,
      payload,
      progress: DEFAULT_PROGRESS,
      created_by: createdBy,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create sync job')
  return data as SyncJobRow
}

export async function getSyncJob(id: string): Promise<SyncJobRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('sync_jobs').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as SyncJobRow | null) ?? null
}

/**
 * Polling/UI read that deliberately excludes the `payload` JSONB. Use this for
 * every client-facing read; `getSyncJob` is for the runner only.
 */
export async function getSyncJobSummary(id: string): Promise<SyncJobSummary | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sync_jobs')
    .select(SYNC_JOB_SUMMARY_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as SyncJobSummary | null) ?? null
}

export async function updateSyncJob(
  id: string,
  patch: Partial<Pick<SyncJobRow, 'status' | 'phase' | 'payload' | 'progress' | 'completed_at'>>,
): Promise<SyncJobRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sync_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update sync job')
  return data as SyncJobRow
}

/**
 * Update a job without reading the heavy `payload` back (PostgREST
 * `return=minimal`). Use when the caller already has the payload in memory and
 * does not consume the returned row — e.g. releasing the processing lock.
 */
export async function updateSyncJobWithoutReturn(
  id: string,
  patch: Partial<Pick<SyncJobRow, 'status' | 'phase' | 'payload' | 'progress' | 'completed_at'>>,
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('sync_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function cancelSyncJob(id: string): Promise<SyncJobRow> {
  return updateSyncJob(id, {
    status: 'cancelled',
    completed_at: new Date().toISOString(),
  })
}

/**
 * Active jobs for the admin UI / pollers. Never transfers the `payload` JSONB.
 * (There is deliberately no full-payload list variant — the runner uses
 * `getSyncJob` for a single id.)
 */
export async function listActiveSyncJobsSummary(types?: SyncJobType[]): Promise<SyncJobSummary[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('sync_jobs')
    .select(SYNC_JOB_SUMMARY_COLUMNS)
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (types && types.length > 0) {
    query = query.in('type', types)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as SyncJobSummary[]
}

export async function listStaleRunningJobs(olderThanMs: number): Promise<SyncJobSummary[]> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - olderThanMs).toISOString()
  const { data, error } = await supabase
    .from('sync_jobs')
    .select(SYNC_JOB_SUMMARY_COLUMNS)
    .in('status', ['pending', 'running'])
    .lt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as SyncJobSummary[]
}