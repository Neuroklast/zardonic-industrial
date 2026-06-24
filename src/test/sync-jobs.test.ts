import { describe, expect, it } from 'vitest'
import type { SyncJobProgress } from '@/lib/sync-jobs'

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