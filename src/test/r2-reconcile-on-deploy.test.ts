import { describe, expect, it } from 'vitest'
import { shouldRunR2DeployReconcile } from '@/lib/r2-reconcile-on-deploy'

describe('shouldRunR2DeployReconcile', () => {
  it('skips preview, local, and missing sha', () => {
    expect(
      shouldRunR2DeployReconcile({ vercelEnv: 'preview', commitSha: 'abc', last: null }).run,
    ).toBe(false)
    expect(
      shouldRunR2DeployReconcile({ vercelEnv: undefined, commitSha: 'abc', last: null }).run,
    ).toBe(false)
    expect(
      shouldRunR2DeployReconcile({ vercelEnv: 'production', commitSha: '', last: null }).run,
    ).toBe(false)
  })

  it('runs once per production sha and skips when already ok', () => {
    expect(
      shouldRunR2DeployReconcile({ vercelEnv: 'production', commitSha: 'abc', last: null }).run,
    ).toBe(true)
    expect(
      shouldRunR2DeployReconcile({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'ok' },
      }).run,
    ).toBe(false)
    expect(
      shouldRunR2DeployReconcile({
        vercelEnv: 'production',
        commitSha: 'def',
        last: { sha: 'abc', status: 'ok' },
      }).run,
    ).toBe(true)
  })

  it('skips a fresh in-progress run but retries after stale or error', () => {
    const now = Date.parse('2026-08-30T12:00:00.000Z')
    expect(
      shouldRunR2DeployReconcile({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'running', startedAt: '2026-08-30T11:55:00.000Z' },
        nowMs: now,
      }).run,
    ).toBe(false)
    expect(
      shouldRunR2DeployReconcile({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'running', startedAt: '2026-08-30T11:00:00.000Z' },
        nowMs: now,
      }).run,
    ).toBe(true)
    expect(
      shouldRunR2DeployReconcile({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'error', error: 'R2 timeout' },
      }).run,
    ).toBe(true)
  })
})
