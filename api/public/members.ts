/**
 * Public Members API — returns active shell members.
 * OWASP A01:2021 — Only active members are exposed publicly.
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
    const members = await prisma.shellMember.findMany({
      where: { isActive: true },
      orderBy: { slotIndex: 'asc' },
      select: {
        id: true, name: true, role: true, slotIndex: true,
        imageUrl: true, bio: true, socialLinks: true,
      },
    })
    return res.status(200).json(members)
  } catch (err) {
    console.error('[public/members]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
