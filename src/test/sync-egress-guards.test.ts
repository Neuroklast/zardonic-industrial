import { describe, expect, it } from 'vitest'
import { shouldContinueSyncJob } from '@/lib/sync-job-scheduling'

describe('sync continuation guards', () => {
  it('continues only after a running chunk that owns its lock', () => {
    expect(shouldContinueSyncJob({ done: false, job: { status: 'running' } })).toBe(true)
    expect(shouldContinueSyncJob({ done: false, busy: true, job: { status: 'running' } })).toBe(false)
    expect(shouldContinueSyncJob({ done: false, job: { status: 'pending' } })).toBe(false)
    expect(shouldContinueSyncJob({ done: true, job: { status: 'completed' } })).toBe(false)
    expect(shouldContinueSyncJob({ done: true, job: { status: 'cancelled' } })).toBe(false)
  })
})
