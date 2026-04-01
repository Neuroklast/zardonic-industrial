/**
 * Public Site API — returns published site config + sections.
 * No authentication required. Only published content is returned.
 * OWASP A01:2021 — Public endpoint: draft content is never exposed.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { applyRateLimit } from '../_ratelimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  try {
    const [config, sections] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { id: 'main' } }),
      // OWASP A01:2021 — Only return enabled, published sections
      prisma.section.findMany({
        where: { enabled: true, isDraft: false },
        orderBy: { sortOrder: 'asc' },
        // OWASP A02:2021 — Exclude internal draft fields from public response
        select: { id: true, type: true, title: true, sortOrder: true, publishedContent: true },
      }),
    ])

    return res.status(200).json({ config, sections })
  } catch (err) {
    console.error('[public/site]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
