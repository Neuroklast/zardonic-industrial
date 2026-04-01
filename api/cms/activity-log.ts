/**
 * CMS Activity Log API — read-only audit trail.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A09:2021 — Security Logging: surfacing log data for admin review.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  entity: z.string().max(100).optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const parsed = querySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query params' })

    const { limit, offset, entity } = parsed.data

    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where: entity ? { entity } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({ where: entity ? { entity } : undefined }),
    ])

    return res.status(200).json({ logs, total, limit, offset })
  } catch (err) {
    console.error('[cms/activity-log]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
