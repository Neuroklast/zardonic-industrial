import { kv, isRedisConfigured } from './_redis.js'
import { Ratelimit } from '@upstash/ratelimit'
import { createHash, randomBytes } from 'node:crypto'

/**
 * GDPR-compliant rate limiting utility for Vercel serverless functions.
 *
 * - Uses `@upstash/ratelimit` with Vercel KV (Redis) as the backing store.
 * - IP addresses are hashed with SHA-256 + a secret salt before being used
 *   as rate-limit identifiers, so no personal data (IP) is ever stored in
 *   plaintext. Rate-limit state auto-expires after the sliding window period.
 * - In production the RATE_LIMIT_SALT environment variable MUST be set to a
 *   unique random string. The module throws at startup if the variable is
 *   absent in a production environment (NODE_ENV=production).
 * - In development/CI a per-process random salt is generated automatically so
 *   local testing works without extra configuration; this random value is never
 *   persisted and cannot be guessed from the source code.
 *
 * See also: middleware.js — the Edge middleware uses the same salt approach
 * with the Web Crypto API instead of Node's `crypto` module.
 */

// ─── Salt ─────────────────────────────────────────────────────────────────────

// Refuse to start in production without a unique salt — a static fallback
// would allow attackers to reverse IP hashes via rainbow tables because the
// source code (and thus the fallback) is publicly available.
if (!process.env.RATE_LIMIT_SALT && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[SECURITY] RATE_LIMIT_SALT environment variable is not set. ' +
    'A unique random salt is required in production to protect IP hashes.'
  )
}

// In non-production environments (local dev / CI) use a per-process random salt
// so that rate-limit identifiers are still anonymised without requiring a config
// change, and without embedding a guessable string in the source code.
// Note: the salt is stable for the lifetime of the process (a warm serverless
// container reuse window is typically a few minutes), which is acceptable for
// development. Set RATE_LIMIT_SALT explicitly in staging/production.
const SALT = process.env.RATE_LIMIT_SALT ?? randomBytes(32).toString('hex')

// ─── Request / response types ─────────────────────────────────────────────────

/** Minimal shape of an incoming Vercel serverless request used by this module. */
interface VercelLikeRequest {
  headers: Record<string, string | string[] | undefined>
}

/** Minimal shape of a Vercel serverless response used by this module. */
interface VercelLikeResponse {
  setHeader(name: string, value: string): VercelLikeResponse
  status(code: number): VercelLikeResponse
  json(data: unknown): VercelLikeResponse
}

// ─── IP utilities ─────────────────────────────────────────────────────────────

/**
 * Hash an IP address with SHA-256 + salt so it can be used as a rate-limit
 * key without storing PII.
 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(SALT + ip).digest('hex')
}

/**
 * Extract the client IP from a Vercel serverless request.
 * Vercel sets `x-forwarded-for`; we take the first address in the chain.
 */
export function getClientIp(req: VercelLikeRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return '127.0.0.1'
}

/**
 * Extract Vercel-provided geographic metadata from request headers.
 * Country codes and coordinates are not personal data under GDPR Art. 4,
 * so they may be stored directly (no hashing required).
 */
export function getVercelGeoData(req: VercelLikeRequest): {
  countryCode: string | null
  region: string | null
  city: string | null
  lat: string | null
  lon: string | null
} {
  const h = req.headers
  const hStr = (name: string): string | null => {
    const val = h[name]
    if (typeof val === 'string') return val || null
    if (Array.isArray(val)) return val[0] || null
    return null
  }
  return {
    countryCode: hStr('x-vercel-ip-country'),
    region: hStr('x-vercel-ip-country-region'),
    city: hStr('x-vercel-ip-city'),
    lat: hStr('x-vercel-ip-latitude'),
    lon: hStr('x-vercel-ip-longitude'),
  }
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

export const PER_IP_LIMIT = 30
export const PER_IP_WINDOW = '60 s' as const
export const PER_IP_RETRY_AFTER_SEC = '10'

export const ODESLI_GLOBAL_LIMIT = 5
export const ODESLI_GLOBAL_WINDOW = '60 s' as const
export const ODESLI_GLOBAL_RETRY_AFTER_SEC = '60'

/**
 * Lazily-initialised rate limiter instance.
 * Sliding window per hashed IP.
 */
let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  if (!isRedisConfigured()) return null
  ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(PER_IP_LIMIT, PER_IP_WINDOW),
    prefix: 'nk-rl',
  })
  return ratelimit
}

/**
 * Lazily-initialised **global** rate limiter for outbound Odesli API calls.
 * Odesli's free tier allows ~10 requests per minute from a single server IP.
 * This limiter caps the entire application to 5 calls per 60 seconds (a safe
 * margin below 10) using a fixed identifier so it counts across all users.
 * Created on first use; null when KV is not configured.
 */
let odesliGlobalRatelimit: Ratelimit | null = null

function getOdesliGlobalRatelimit(): Ratelimit | null {
  if (odesliGlobalRatelimit) return odesliGlobalRatelimit
  if (!isRedisConfigured()) return null
  odesliGlobalRatelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(ODESLI_GLOBAL_LIMIT, ODESLI_GLOBAL_WINDOW),
    prefix: 'nk-odesli-global',
  })
  return odesliGlobalRatelimit
}

/**
 * Apply the global Odesli outbound rate limit.
 *
 * This limiter uses a fixed identifier ("global") so it counts every outbound
 * Odesli API request regardless of which end-user triggered it. Returns `true`
 * when the request is allowed. Returns `false` and sends a 429 response when
 * the global cap (5 req / 60 s) would be exceeded. If KV is unavailable the
 * function allows the request (dev mode / no Redis).
 *
 * @example
 * const allowed = await applyOdesliGlobalRateLimit(res)
 * if (!allowed) return   // 429 already sent
 * // … call Odesli API
 */
export async function applyOdesliGlobalRateLimit(
  res: VercelLikeResponse,
): Promise<boolean> {
  const rl = getOdesliGlobalRatelimit()
  if (!rl) return true // KV not configured — allow (dev mode)

  try {
    const { success } = await rl.limit('global')
    if (!success) {
      res.setHeader('Retry-After', ODESLI_GLOBAL_RETRY_AFTER_SEC)
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Odesli API rate limit reached. Please try again in a minute.',
      })
      return false
    }
    return true
  } catch (err) {
    console.error('Odesli global rate limit check failed, allowing request:', err)
    return true // fail open for global limiter — don't block users if Redis hiccups
  }
}

/**
 * Apply rate limiting to a serverless request.
 *
 * Returns `true` when the request is allowed.  Returns `false` and sends a
 * 429 response when the limit has been exceeded.  If KV is unavailable the
 * function fails closed (503) to prevent brute-force bypass by destabilizing
 * the KV backend.
 *
 * @example
 * const allowed = await applyRateLimit(req, res)
 * if (!allowed) return   // 429 / 503 already sent
 * // … handle request normally
 */
export async function applyRateLimit(
  req: VercelLikeRequest,
  res: VercelLikeResponse,
): Promise<boolean> {
  const rl = getRatelimit()
  if (!rl) return true // KV not configured — allow (dev mode)

  const ip = getClientIp(req)
  const identifier = hashIp(ip)

  try {
    const { success } = await rl.limit(identifier)
    if (!success) {
      res.setHeader('Retry-After', PER_IP_RETRY_AFTER_SEC)
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again in a few seconds.',
      })
      return false
    }
    return true
  } catch (err) {
    console.error('Rate limit check failed, blocking request:', err)
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Rate limiting service is temporarily unavailable. Please try again later.',
    })
    return false
  }
}

