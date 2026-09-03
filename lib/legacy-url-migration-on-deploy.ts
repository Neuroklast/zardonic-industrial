import { listAllR2ObjectKeys } from '@/lib/r2-inventory'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { migrateLegacySupabaseUrlsToR2, type LegacyUrlMigrationResult } from '@/lib/legacy-url-migrator'

/**
 * Automatically migrates legacy `*.supabase.co` media URLs onto R2 once per
 * production deploy SHA (same gate pattern as the R2 host reconcile:
 * lib/r2-reconcile-on-deploy.ts). Ran from instrumentation.ts.
 *
 * Progress is stored in site_config so concurrent cold starts do not run the
 * migration twice for one SHA.
 */

export const LEGACY_URL_MIGRATION_DEPLOY_KEY = 'legacy_url_migration_deploy'

export interface LegacyUrlMigrationDeployState {
  sha: string
  status: 'running' | 'ok' | 'error'
  startedAt?: string
  finishedAt?: string
  error?: string
  scanned?: number
  cleaned?: number
  reused?: number
  copied?: number
  failed?: number
  /** Set once a migration has succeeded — the job then only ever runs once. */
  doneOnce?: boolean
}

export const LEGACY_URL_MIGRATION_RUNNING_STALE_MS = 10 * 60 * 1000

export function shouldRunDeployLegacyMigration(options: {
  vercelEnv: string | undefined
  commitSha: string | undefined
  last: LegacyUrlMigrationDeployState | null
  nowMs?: number
}): { run: boolean; reason: string } {
  if (options.vercelEnv !== 'production') {
    return { run: false, reason: `skip: VERCEL_ENV=${options.vercelEnv ?? 'unset'}` }
  }
  // Strict once-ever semantics: after the first successful migration we never
  // scan again (no per-SHA re-runs). Removing flag `doneOnce` re-arms it.
  if (options.last?.doneOnce) {
    return { run: false, reason: 'skip: already migrated once (doneOnce)' }
  }
  const sha = options.commitSha?.trim()
  if (!sha) {
    return { run: false, reason: 'skip: no VERCEL_GIT_COMMIT_SHA' }
  }
  if (options.last?.sha === sha && options.last.status === 'ok') {
    return { run: false, reason: `skip: already ok for ${sha}` }
  }
  if (options.last?.sha === sha && options.last.status === 'running') {
    const started = options.last.startedAt ? Date.parse(options.last.startedAt) : NaN
    const now = options.nowMs ?? Date.now()
    if (Number.isFinite(started) && now - started < LEGACY_URL_MIGRATION_RUNNING_STALE_MS) {
      return { run: false, reason: `skip: already running for ${sha}` }
    }
  }
  return { run: true, reason: `run for ${sha}` }
}

export function parseDeployState(raw: unknown): LegacyUrlMigrationDeployState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.sha !== 'string' || !obj.sha) return null
  if (obj.status !== 'running' && obj.status !== 'ok' && obj.status !== 'error') return null
  const toNumber = (v: unknown): number | undefined =>
    typeof v === 'number' ? v : undefined
  return {
    sha: obj.sha,
    status: obj.status,
    startedAt: typeof obj.startedAt === 'string' ? obj.startedAt : undefined,
    finishedAt: typeof obj.finishedAt === 'string' ? obj.finishedAt : undefined,
    error: typeof obj.error === 'string' ? obj.error : undefined,
    scanned: toNumber(obj.scanned),
    cleaned: toNumber(obj.cleaned),
    reused: toNumber(obj.reused),
    copied: toNumber(obj.copied),
    failed: toNumber(obj.failed),
    doneOnce: obj.doneOnce === true,
  }
}

function summarize(result: LegacyUrlMigrationResult): string {
  return (
    `scanned=${result.scanned} cleaned=${result.cleaned} reused=${result.reused} ` +
    `copied=${result.copied} failed=${result.failed}`
  )
}

/**
 * Once per production deploy SHA: migrate legacy Supabase Storage URLs onto R2.
 * Best-effort — failures are logged and stored, never crash the server.
 */
export async function runProductionDeployLegacyUrlMigration(): Promise<void> {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim()
  if (!process.env.R2_PUBLIC_HOST || !process.env.R2_BUCKET_MEDIA || !process.env.R2_ACCOUNT_ID) {
    if (process.env.VERCEL_ENV === 'production') {
      console.info('[legacy-url-migration] skip: R2 env incomplete')
    }
    return
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.VERCEL_ENV === 'production') {
      console.info('[legacy-url-migration] skip: Supabase admin env incomplete')
    }
    return
  }

  const supabase = createAdminClient()
  const { data, error: readError } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', LEGACY_URL_MIGRATION_DEPLOY_KEY)
    .maybeSingle()
  if (readError) {
    console.error('[legacy-url-migration] could not read deploy state:', readError.message)
    return
  }

  const last = parseDeployState(data?.value)
  const decided = shouldRunDeployLegacyMigration({
    vercelEnv: process.env.VERCEL_ENV,
    commitSha: sha,
    last,
  })
  console.info(`[legacy-url-migration] ${decided.reason}`)
  if (!decided.run || !sha) return

  const startedAt = new Date().toISOString()
  await supabase.from('site_config').upsert({
    key: LEGACY_URL_MIGRATION_DEPLOY_KEY,
    value: { sha, status: 'running', startedAt } satisfies LegacyUrlMigrationDeployState,
    updated_at: startedAt,
  })

  try {
    const objectKeys = await listAllR2ObjectKeys({ bucket: process.env.R2_BUCKET_MEDIA })
    const result = await migrateLegacySupabaseUrlsToR2({
      supabase,
      objectKeys,
      apply: true,
      log: (line) => console.info(`[legacy-url-migration] ${line}`),
    })
    const finishedAt = new Date().toISOString()
    await supabase.from('site_config').upsert({
      key: LEGACY_URL_MIGRATION_DEPLOY_KEY,
      value: {
        sha,
        status: 'ok',
        startedAt,
        finishedAt,
        scanned: result.scanned,
        cleaned: result.cleaned,
        reused: result.reused,
        copied: result.copied,
        failed: result.failed,
        doneOnce: true,
      } satisfies LegacyUrlMigrationDeployState,
      updated_at: finishedAt,
    })
    for (const failure of result.failures) {
      console.warn(`[legacy-url-migration] ${failure}`)
    }
    console.info(`[legacy-url-migration] done ${summarize(result)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error('[legacy-url-migration] failed:', message)
    await supabase.from('site_config').upsert({
      key: LEGACY_URL_MIGRATION_DEPLOY_KEY,
      value: {
        sha,
        status: 'error',
        startedAt,
        finishedAt: new Date().toISOString(),
        error: message,
      } satisfies LegacyUrlMigrationDeployState,
      updated_at: new Date().toISOString(),
    })
  }
}
