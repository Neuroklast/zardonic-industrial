import { listAllR2ObjectKeys } from '@/lib/r2-inventory'
import { applyR2MediaReconcile } from '@/lib/r2-reconcile'
import { createAdminClient } from '@/lib/supabaseAdmin'
import type { MediaRewriteClient } from '@/lib/r2-url-rewrite'

export const R2_RECONCILE_DEPLOY_KEY = 'r2_reconcile_deploy'

export interface R2ReconcileDeployState {
  sha: string
  status: 'running' | 'ok' | 'error'
  startedAt?: string
  finishedAt?: string
  error?: string
  objectCount?: number
  rewrittenRows?: number
  replacements?: number
}

export const R2_RECONCILE_RUNNING_STALE_MS = 10 * 60 * 1000

export function shouldRunR2DeployReconcile(options: {
  vercelEnv: string | undefined
  commitSha: string | undefined
  last: R2ReconcileDeployState | null
  nowMs?: number
}): { run: boolean; reason: string } {
  if (options.vercelEnv !== 'production') {
    return { run: false, reason: `skip: VERCEL_ENV=${options.vercelEnv ?? 'unset'}` }
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
    if (Number.isFinite(started) && now - started < R2_RECONCILE_RUNNING_STALE_MS) {
      return { run: false, reason: `skip: already running for ${sha}` }
    }
  }
  return { run: true, reason: `run for ${sha}` }
}

function parseDeployState(raw: unknown): R2ReconcileDeployState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.sha !== 'string' || !obj.sha) return null
  if (obj.status !== 'running' && obj.status !== 'ok' && obj.status !== 'error') return null
  return {
    sha: obj.sha,
    status: obj.status,
    startedAt: typeof obj.startedAt === 'string' ? obj.startedAt : undefined,
    finishedAt: typeof obj.finishedAt === 'string' ? obj.finishedAt : undefined,
    error: typeof obj.error === 'string' ? obj.error : undefined,
  }
}

/**
 * Once per production deploy SHA: list the live R2 bucket and rewrite stale
 * DB URLs. Failures are logged and stored; they must not crash the server.
 */
export async function runProductionDeployR2Reconcile(): Promise<void> {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim()
  if (!process.env.R2_PUBLIC_HOST || !process.env.R2_BUCKET_MEDIA || !process.env.R2_ACCOUNT_ID) {
    if (process.env.VERCEL_ENV === 'production') {
      console.info('[r2-reconcile] skip: R2 env incomplete')
    }
    return
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.VERCEL_ENV === 'production') {
      console.info('[r2-reconcile] skip: Supabase admin env incomplete')
    }
    return
  }

  const supabase = createAdminClient()
  const { data, error: readError } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', R2_RECONCILE_DEPLOY_KEY)
    .maybeSingle()
  if (readError) {
    console.error('[r2-reconcile] could not read deploy state:', readError.message)
    return
  }

  const last = parseDeployState(data?.value)
  const decided = shouldRunR2DeployReconcile({
    vercelEnv: process.env.VERCEL_ENV,
    commitSha: sha,
    last,
  })
  console.info(`[r2-reconcile] ${decided.reason}`)
  if (!decided.run || !sha) return

  const startedAt = new Date().toISOString()
  await supabase.from('site_config').upsert({
    key: R2_RECONCILE_DEPLOY_KEY,
    value: { sha, status: 'running', startedAt } satisfies R2ReconcileDeployState,
    updated_at: startedAt,
  })

  try {
    const objectKeys = await listAllR2ObjectKeys({
      bucket: process.env.R2_BUCKET_MEDIA,
    })
    const result = await applyR2MediaReconcile(supabase as unknown as MediaRewriteClient, {
      publicHost: process.env.R2_PUBLIC_HOST ?? '',
      objectKeys,
      mediaBucket: process.env.R2_BUCKET_MEDIA,
      dryRun: false,
    })
    const finishedAt = new Date().toISOString()
    await supabase.from('site_config').upsert({
      key: R2_RECONCILE_DEPLOY_KEY,
      value: {
        sha,
        status: 'ok',
        startedAt,
        finishedAt,
        objectCount: result.objectCount,
        rewrittenRows: result.rewrittenRows,
        replacements: result.replacements,
      } satisfies R2ReconcileDeployState,
      updated_at: finishedAt,
    })
    console.info(
      `[r2-reconcile] done objects=${result.objectCount} rows=${result.rewrittenRows} urls=${result.replacements}`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error('[r2-reconcile] failed:', message)
    await supabase.from('site_config').upsert({
      key: R2_RECONCILE_DEPLOY_KEY,
      value: {
        sha,
        status: 'error',
        startedAt,
        finishedAt: new Date().toISOString(),
        error: message,
      } satisfies R2ReconcileDeployState,
      updated_at: new Date().toISOString(),
    })
  }
}
