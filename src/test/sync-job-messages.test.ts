import { describe, expect, it } from 'vitest'
import {
  getSyncJobLabel,
  getSyncJobProgressPercent,
  getSyncJobStatusMessage,
} from '@/lib/sync-job-messages'
import type { SyncJobRow } from '@/lib/sync-jobs'

function makeJob(partial: Partial<SyncJobRow>): SyncJobRow {
  return {
    id: 'job-1',
    type: 'spotify_sync',
    status: 'running',
    phase: 'import',
    payload: {},
    progress: {
      processed: 5,
      total: 10,
      synced: 3,
      updated: 1,
      skipped: 1,
      errors: [],
    },
    created_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    completed_at: null,
    ...partial,
  }
}

describe('sync job messages', () => {
  it('labels job types for the admin UI', () => {
    expect(getSyncJobLabel('track_enrichment')).toBe('Track enrichment')
    expect(getSyncJobLabel('bandsintown_sync')).toBe('Bandsintown events')
  })

  it('calculates progress percent from processed/total', () => {
    expect(getSyncJobProgressPercent(makeJob({ status: 'completed' }))).toBe(100)
    expect(getSyncJobProgressPercent(makeJob({ status: 'running' }))).toBe(50)
  })

  it('returns speaking status messages per phase', () => {
    const message = getSyncJobStatusMessage(makeJob({ status: 'running', phase: 'import' }))
    expect(message).toMatch(/Spotify import/i)
    expect(message).toMatch(/5 of 10/)
  })
})