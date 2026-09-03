import { createHash, randomBytes } from 'node:crypto'
import { headers as nextHeaders } from 'next/headers'
import { createAdminClient } from '@/lib/supabaseAdmin'

/**
 * Enterprise-grade, distributed rate limiter backed by Supabase Postgres.
 *
 * - No Redis: the atomic fixed-window counter lives in `public.rate_limits`,
 *   incremented via the `consume_rate_limit` Postgres function (SECURITY DEFINER,
 *   service-role only). This is globally consistent across all serverless instances.
 * - Privacy (GDPR): the client IP is hashed with SHA-256 + `RATE_LIMIT_SALT`
 *   before use; only the hash is ever persisted. No plaintext IPs are stored.
 * - Resilience: if the Postgres call fails (network/DB down), a per-instance
 *   in-memory sliding-window counter is used as a backstop so the limit is still
 *   enforced (never silently bypassed).
 */

export interface RateLimitResult {
  namespace: string
  allowed: boolean
  /** Seconds until the window resets — present when disallowed. */
  retryAfter?: number
}

export interface RateLimitOptions {
  namespace: string
  /** Max allowed calls per window for a single identifier. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
  /** Explicit client IP. When omitted, read from the request headers. */
  ip?: string
  /** Explicit headers object (Route Handlers). When omitted, uses next/headers(). */
  headers?: Headers
}

let salt: string | null = null

function resolveSalt(): string {
  if (salt) return salt
  if (process.env.RATE_LIMIT_SALT) {
    salt = process.env.RATE_LIMIT_SALT
    return salt
  }
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  if (process.env.NODE_ENV === 'production' && !isBuild) {
    throw new Error(
      '[SECURITY] RATE_LIMIT_SALT environment variable is not set. ' +
        'A unique random salt is required in production to protect IP hashes.',
    )
  }
  salt = randomBytes(32).toString('hex')
  return salt
}

function hashIp(ip: string): string {
  return createHash('sha256').update(resolveSalt() + ip).digest('hex')
}

function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || '127.0.0.1'
  return headers.get('x-real-ip') || '127.0.0.1'
}

/**
 * Atomic fixed-window counter via Supabase Postgres.
 * Throws when the RPC errors; caller falls back to the in-memory backstop.
 */
async function consumeSupabase(
  namespace: string,
  ipHash: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('consume_rate_limit', {
    p_key: `${namespace}:${ipHash}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) throw error

  const payload = (data && typeof data === 'object' ? data : {}) as {
    count?: number
    reset_at?: number
  }
  const count = typeof payload.count === 'number' ? payload.count : 0
  const resetAt =
    typeof payload.reset_at === 'number' && payload.reset_at > 0
      ? payload.reset_at
      : Date.now() + windowSeconds * 1000

  const allowed = count <= limit
  return {
    namespace,
    allowed,
    retryAfter: allowed ? undefined : Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)),
  }
}

interface MemoryEntry {
  count: number
  resetAt: number
}

const memory = new Map<string, MemoryEntry>()
const MEMORY_MAX_ENTRIES = 20_000

/**
 * Per-instance sliding-window backstop used when the Postgres RPC is unavailable.
 * Not globally consistent, but still enforces the limit within this instance.
 */
function consumeMemory(
  namespace: string,
  ipHash: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const key = `${namespace}:${ipHash}`
  const now = Date.now()

  if (memory.size > MEMORY_MAX_ENTRIES) {
    for (const [k, e] of memory) {
      if (e.resetAt <= now) memory.delete(k)
    }
  }

  const entry = memory.get(key)
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { namespace, allowed: true }
  }

  entry.count += 1
  const allowed = entry.count <= limit
  return {
    namespace,
    allowed,
    retryAfter: allowed ? undefined : Math.max(0, Math.ceil((entry.resetAt - now) / 1000)),
  }
}

/**
 * Consume one rate-limit unit. Returns whether the request is allowed.
 * Never bypasses: Postgres first, in-memory backstop on infra failure.
 */
export async function consumeRequestRateLimit(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const { namespace, limit, windowSeconds } = options
  const ip = options.ip ?? clientIpFrom(options.headers ?? (await nextHeaders()))
  const ipHash = hashIp(ip)

  try {
    return await consumeSupabase(namespace, ipHash, limit, windowSeconds)
  } catch (err) {
    console.warn(`[rate-limit] Postgres limiter unavailable, using in-memory backstop:`, err)
    return consumeMemory(namespace, ipHash, limit, windowSeconds)
  }
}

/** Convenience for callers that already have a `request` (Route Handlers). */
export async function consumeRateLimitForRequest(
  request: Request,
  options: Omit<RateLimitOptions, 'ip' | 'headers'>,
): Promise<RateLimitResult> {
  return consumeRequestRateLimit({ ...options, headers: request.headers })
}
