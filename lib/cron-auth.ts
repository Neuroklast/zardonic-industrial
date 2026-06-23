import { timingSafeEqual } from 'node:crypto'

/** Constant-time comparison for cron bearer tokens. */
export function verifyCronSecret(provided: string | null | undefined): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected || !provided) return false

  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(provided, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function readBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) return null
  const token = authorizationHeader.slice(7).trim()
  return token || null
}