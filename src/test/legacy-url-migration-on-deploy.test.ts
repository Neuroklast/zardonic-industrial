import { describe, expect, it } from 'vitest'
import { shouldRunDeployLegacyMigration, parseDeployState } from '@/lib/legacy-url-migration-on-deploy'

describe('shouldRunDeployLegacyMigration', () => {
  it('skips preview, local, and missing sha', () => {
    expect(
      shouldRunDeployLegacyMigration({ vercelEnv: 'preview', commitSha: 'abc', last: null }).run,
    ).toBe(false)
    expect(
      shouldRunDeployLegacyMigration({ vercelEnv: undefined, commitSha: 'abc', last: null }).run,
    ).toBe(false)
    expect(
      shouldRunDeployLegacyMigration({ vercelEnv: 'production', commitSha: '', last: null }).run,
    ).toBe(false)
  })

  it('runs once per production sha and skips when already ok', () => {
    expect(
      shouldRunDeployLegacyMigration({ vercelEnv: 'production', commitSha: 'abc', last: null }).run,
    ).toBe(true)
    expect(
      shouldRunDeployLegacyMigration({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'ok' },
      }).run,
    ).toBe(false)
    expect(
      shouldRunDeployLegacyMigration({
        vercelEnv: 'production',
        commitSha: 'def',
        last: { sha: 'abc', status: 'ok' },
      }).run,
    ).toBe(true)
  })

  it('never runs again once doneOnce is set (strict once-ever)', () => {
    expect(
      shouldRunDeployLegacyMigration({
        vercelEnv: 'production',
        commitSha: 'def',
        last: { sha: 'abc', status: 'ok', doneOnce: true },
      }).run,
    ).toBe(false)
    expect(
      shouldRunDeployLegacyMigration({
        vercelEnv: 'production',
        commitSha: 'def',
        last: { sha: 'abc', status: 'ok', doneOnce: true },
      }).reason,
    ).toContain('doneOnce')
  })

  it('skips a fresh in-progress run but retries after stale or error', () => {
    const now = Date.parse('2026-09-03T12:00:00.000Z')
    expect(
      shouldRunDeployLegacyMigration({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'running', startedAt: '2026-09-03T11:55:00.000Z' },
        nowMs: now,
      }).run,
    ).toBe(false)
    expect(
      shouldRunDeployLegacyMigration({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'running', startedAt: '2026-09-03T11:00:00.000Z' },
        nowMs: now,
      }).run,
    ).toBe(true)
    expect(
      shouldRunDeployLegacyMigration({
        vercelEnv: 'production',
        commitSha: 'abc',
        last: { sha: 'abc', status: 'error', error: 'R2 timeout' },
      }).run,
    ).toBe(true)
  })
})

describe('parseDeployState', () => {
  it('parses a finished state and ignores invalid shapes', () => {
    const parsed = parseDeployState({
      sha: 'abc123',
      status: 'ok',
      scanned: 5,
      cleaned: 2,
      reused: 1,
      copied: 1,
      failed: 0,
      doneOnce: true,
    })
    expect(parsed?.sha).toBe('abc123')
    expect(parsed?.status).toBe('ok')
    expect(parsed?.copied).toBe(1)
    expect(parsed?.doneOnce).toBe(true)
    expect(parseDeployState(null)).toBeNull()
    expect(parseDeployState({})).toBeNull()
    expect(parseDeployState({ sha: '', status: 'ok' })).toBeNull()
  })
})
