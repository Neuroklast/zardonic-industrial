import { headers } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createHash, randomBytes } from 'node:crypto'

const NEWSLETTER_LIMIT = 5
const NEWSLETTER_WINDOW = '15 m' as const
const CONTACT_LIMIT = 5
const CONTACT_WINDOW = '15 m' as const

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

function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function hashIp(ip: string): string {
  return createHash('sha256').update(resolveSalt() + ip).digest('hex')
}

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRatelimit(prefix: string, limit: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`): Ratelimit | null {
  if (limiters.has(prefix)) return limiters.get(prefix)!
  if (!isRedisConfigured()) return null

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  if (!redis) {
    redis = new Redis({ url, token })
  }

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
  })
  limiters.set(prefix, rl)
  return rl
}

async function getRequestIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || '127.0.0.1'
  return h.get('x-real-ip') ?? '127.0.0.1'
}

async function checkLimit(
  prefix: string,
  limit: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
  label: string,
): Promise<boolean> {
  const rl = getRatelimit(prefix, limit, window)
  if (!rl) return true

  try {
    const ip = await getRequestIp()
    const { success } = await rl.limit(hashIp(ip))
    return success
  } catch (err) {
    console.error(`[${label}] rate limit check failed, allowing:`, err)
    return true
  }
}

/**
 * Rate limit for public newsletter server actions.
 * Returns true when allowed; false when limit exceeded.
 * No-op when Redis is not configured (local dev).
 */
export async function checkNewsletterRateLimit(): Promise<boolean> {
  return checkLimit('nk-newsletter-rl', NEWSLETTER_LIMIT, NEWSLETTER_WINDOW, 'newsletter')
}

/**
 * Rate limit for public contact form server actions.
 */
export async function checkContactRateLimit(): Promise<boolean> {
  return checkLimit('nk-contact-rl', CONTACT_LIMIT, CONTACT_WINDOW, 'contact')
}
