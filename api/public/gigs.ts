/**
 * Public Gigs API — returns upcoming published gigs.
 * OWASP A01:2021 — Draft gigs are never exposed to the public.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { applyRateLimit } from '../_ratelimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  try {
    const gigs = await prisma.gig.findMany({
      where: { isDraft: false },
      orderBy: { date: 'asc' },
      select: {
        id: true, title: true, venue: true, city: true, country: true,
        date: true, doorsOpen: true, ticketUrl: true, flyerUrl: true,
        description: true, isSoldOut: true, isCancelled: true, isFeatured: true,
        publishedAt: true,
      },
    })
    return res.status(200).json(gigs)
  } catch (err) {
    console.error('[public/gigs]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
