import { createAdminClient } from '@/lib/supabaseAdmin'
import type { CatalogueImportItem } from '@/lib/catalogue-import'

export type SyncJobType =
  | 'discogs_sync'
  | 'spotify_sync'
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
  source?: 'spotify' | 'discogs'
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

export async function cancelSyncJob(id: string): Promise<SyncJobRow> {
  return updateSyncJob(id, {
    status: 'cancelled',
    completed_at: new Date().toISOString(),
  })
}

export async function listStaleRunningJobs(olderThanMs: number): Promise<SyncJobRow[]> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - olderThanMs).toISOString()
  const { data, error } = await supabase
    .from('sync_jobs')
    .select('*')
    .in('status', ['pending', 'running'])
    .lt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as SyncJobRow[]
}