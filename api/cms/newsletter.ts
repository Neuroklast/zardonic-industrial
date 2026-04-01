/**
 * CMS Newsletter API — list and manage subscribers.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A02:2021 — No PII leaked to non-admin callers.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { z } from 'zod'

const deleteSubscriberSchema = z.object({
  id: z.string().min(1).max(200),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  const { id } = req.query as Record<string, string>

  try {
    if (req.method === 'GET') {
      const subscribers = await prisma.subscriber.findMany({
        orderBy: { subscribedAt: 'desc' },
        // OWASP A02:2021 — Only return necessary fields
        select: { id: true, email: true, isActive: true, subscribedAt: true, unsubscribedAt: true },
      })
      return res.status(200).json(subscribers)
    }

    if (req.method === 'DELETE' && id) {
      const parsed = deleteSubscriberSchema.safeParse({ id })
      if (!parsed.success) return res.status(400).json({ error: 'Invalid id' })
      await prisma.subscriber.update({
        where: { id },
        data: { isActive: false, unsubscribedAt: new Date() },
      })
      await logActivity({ action: 'unsubscribe', entity: 'subscriber', entityId: id, req })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/newsletter]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
