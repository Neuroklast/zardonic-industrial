import type { VercelResponse } from '@vercel/node'

/**
 * Legacy Redis/KV API routes are retired in production.
 * Next.js App Router handlers under app/api/** are canonical.
 */
export function respondIfLegacyApiRetired(
  res: VercelResponse,
  successor: string,
): boolean {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') return false
  if (process.env.ENABLE_LEGACY_API === 'true') return false

  res.status(410).json({
    error: 'Legacy endpoint retired',
    successor,
  })
  return true
}