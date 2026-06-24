import { describe, expect, it } from 'vitest'
import { getPaginationRange } from '@/lib/browse-pagination'
import type { SyncJobProgress, SyncJobPayload } from '@/lib/sync-jobs'

describe('sync job progress shape', () => {
  it('defaults include counters used by the admin UI', () => {
    const progress: SyncJobProgress = {
      processed: 0,
      total: null,
      synced: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    }
    expect(progress.errors).toEqual([])
    expect(progress.total).toBeNull()
  })
})

describe('sync job async infrastructure', () => {
  it('exposes continuation scheduler and active jobs route', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const root = resolve(import.meta.dirname, '../..')

    expect(readFileSync(resolve(root, 'lib/sync-job-continuation.ts'), 'utf8')).toMatch(/after\(/)
    expect(readFileSync(resolve(root, 'app/api/sync-jobs/active/route.ts'), 'utf8')).toMatch(
      /listActiveSyncJobs/,
    )
    expect(readFileSync(resolve(root, 'hooks/useSyncJobPoll.ts'), 'utf8')).toMatch(/persistSyncJobId/)
    expect(readFileSync(resolve(root, 'lib/sync-job-messages.ts'), 'utf8')).toMatch(/getSyncJobStatusMessage/)
    expect(readFileSync(resolve(root, 'app/admin/_components/SyncJobStatus.tsx'), 'utf8')).toMatch(/Progress/)
    expect(readFileSync(resolve(root, 'app/admin/(protected)/releases/sync/CatalogueSyncClient.tsx'), 'utf8')).toMatch(
      /track_enrichment/,
    )
    expect(readFileSync(resolve(root, 'lib/sync-job-runner.ts'), 'utf8')).toMatch(/itunes_sync/)
    expect(readFileSync(resolve(root, 'lib/sync-job-runner.ts'), 'utf8')).toMatch(/track_enrichment/)
    expect(readFileSync(resolve(root, 'lib/sync-job-runner.ts'), 'utf8')).toMatch(/bandsintown_sync/)
  })

  it('builds compact pagination ranges for job UI helpers', () => {
    expect(getPaginationRange(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('supports processing lock fields on payload', () => {
    const payload: SyncJobPayload = {
      processing: true,
      processingSince: Date.now(),
      stagedGigs: [],
      gigImportCursor: 0,
    }
    expect(payload.processing).toBe(true)
  })
})