import { Redis } from '@upstash/redis'
import { createHash } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * GDPR-compliant rate limiting utility.
 *
 * IP addresses are hashed with SHA-256 + a secret salt before being used
 * as identifiers, so no personal data (IP) is stored in plaintext.
 * Rate limit state is ephemeral — entries expire automatically after the
 * sliding window period.
 *
 * The salt is read from the RATE_LIMIT_SALT environment variable. If absent,
 * a hardcoded fallback is used so the system still works in development.
 */

const SALT = process.env.RATE_LIMIT_SALT || 'zd-default-rate-limit-salt-change-me'

if (!process.env.RATE_LIMIT_SALT && process.env.NODE_ENV === 'production') {
  throw new Error('[SECURITY] RATE_LIMIT_SALT environment variable is not set. A unique random salt is required in production to protect IP hashes. Generate one with: openssl rand -hex 32')
}

const WINDOW_SECONDS = 10
const MAX_REQUESTS = 5
const RL_PREFIX = 'zd-rl:'

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return _redis
}

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
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim()
  }
  return '127.0.0.1'
}

/**
 * Apply rate limiting to a request using a fixed-window counter in Redis.
 *
 * Returns `true` if the request is allowed, `false` + sends a 429 response
 * if the limit has been exceeded.
 *
 * Usage inside a Vercel handler:
 *   const allowed = await applyRateLimit(req, res)
 *   if (!allowed) return   // 429 already sent
 */
export async function applyRateLimit(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true // Redis not configured — allow (dev mode)

  const ip = getClientIp(req)
  const identifier = hashIp(ip)
  const key = `${RL_PREFIX}${identifier}`

  try {
    const count = await redis.incr(key)
    if (count === 1) {
      // First request in window — set expiry
      await redis.expire(key, WINDOW_SECONDS)
    }
    if (count > MAX_REQUESTS) {
      res.status(429).setHeader('Retry-After', String(WINDOW_SECONDS)).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again in a few seconds.',
      })
      return false
    }
    return true
  } catch {
    return true // On error, allow the request
  }
}
