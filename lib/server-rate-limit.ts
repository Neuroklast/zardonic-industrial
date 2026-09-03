import { consumeRequestRateLimit } from '@/lib/rate-limit'

/**
 * Public form rate limits — now backed by Supabase Postgres
 * (see `lib/rate-limit.ts`), no Redis.
 *
 * These fail CLOSED: on any infra error they return `false` so the caller
 * responds with a friendly "try again" rather than allowing an unthrottled burst.
 */

const NEWSLETTER_LIMIT = 5
const NEWSLETTER_WINDOW_SECONDS = 15 * 60

const CONTACT_LIMIT = 5
const CONTACT_WINDOW_SECONDS = 15 * 60

/**
 * Returns true when allowed; false when the limit is exceeded OR when the
 * limiter cannot be safely consulted (fail-closed).
 */
export async function checkNewsletterRateLimit(): Promise<boolean> {
  try {
    const result = await consumeRequestRateLimit({
      namespace: 'newsletter',
      limit: NEWSLETTER_LIMIT,
      windowSeconds: NEWSLETTER_WINDOW_SECONDS,
    })
    return result.allowed
  } catch (err) {
    console.error('[newsletter] rate limit check failed, denying (fail-closed):', err)
    return false
  }
}

/**
 * Returns true when allowed; false when the limit is exceeded OR when the
 * limiter cannot be safely consulted (fail-closed).
 */
export async function checkContactRateLimit(): Promise<boolean> {
  try {
    const result = await consumeRequestRateLimit({
      namespace: 'contact',
      limit: CONTACT_LIMIT,
      windowSeconds: CONTACT_WINDOW_SECONDS,
    })
    return result.allowed
  } catch (err) {
    console.error('[contact] rate limit check failed, denying (fail-closed):', err)
    return false
  }
}
