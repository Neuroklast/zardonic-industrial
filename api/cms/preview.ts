/**
 * CMS Preview API — returns draft content for preview mode.
 * OWASP A01:2021 — Access Control: admin session required (draft data is private).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { z } from 'zod'

const previewQuerySchema = z.object({
  entity: z.enum(['site', 'release', 'gig', 'video', 'news', 'biography', 'section']),
  id: z.string().max(200).optional(),
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

  const parsed = previewQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid query' })

  const { entity, id } = parsed.data

  try {
    switch (entity) {
      case 'site': {
        const config = await prisma.siteConfig.findUnique({ where: { id: 'main' } })
        const sections = await prisma.section.findMany({ orderBy: { sortOrder: 'asc' } })
        return res.status(200).json({ config, sections })
      }
      case 'release':
        if (!id) return res.status(400).json({ error: 'id required' })
        return res.status(200).json(await prisma.release.findUnique({ where: { id } }))
      case 'gig':
        if (!id) return res.status(400).json({ error: 'id required' })
        return res.status(200).json(await prisma.gig.findUnique({ where: { id } }))
      case 'video':
        if (!id) return res.status(400).json({ error: 'id required' })
        return res.status(200).json(await prisma.video.findUnique({ where: { id } }))
      case 'news':
        if (!id) return res.status(400).json({ error: 'id required' })
        return res.status(200).json(await prisma.newsPost.findUnique({ where: { id } }))
      case 'biography':
        return res.status(200).json(await prisma.biography.findUnique({ where: { id: 'main' } }))
      case 'section':
        if (!id) return res.status(400).json({ error: 'id required' })
        return res.status(200).json(await prisma.section.findUnique({ where: { id } }))
      default:
        return res.status(400).json({ error: 'Unknown entity' })
    }
  } catch (err) {
    console.error('[cms/preview]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
