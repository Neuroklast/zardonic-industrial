/**
 * Activity Log helper — OWASP A09:2021 Security Logging and Monitoring Failures.
 * Writes an entry to the ActivityLog table for every CMS mutation.
 */

import type { VercelRequest } from '@vercel/node'
import { prisma } from './_prisma.js'
import { hashIp, getClientIp } from './_ratelimit.js'

export interface LogActivityOptions {
  action: string
  entity: string
  entityId?: string
  details?: string
  req?: VercelRequest
}

export async function logActivity(opts: LogActivityOptions): Promise<void> {
  try {
    let ipHash: string | undefined
    if (opts.req) {
      const ip = getClientIp(opts.req)
      // OWASP A09:2021 — GDPR: hash IP before logging, never store plaintext
      ipHash = ip ? hashIp(ip) : undefined
    }

    await prisma.activityLog.create({
      data: {
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        details: opts.details ?? null,
        ipHash: ipHash ?? null,
      },
    })
  } catch {
    // Non-fatal: logging failures must never break the main request flow
  }
}
