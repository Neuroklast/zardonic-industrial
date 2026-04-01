/**
 * CMS Biography API — GET/PUT the artist biography.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { biographyUpdateSchema } from '../_cms-schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  try {
    if (req.method === 'GET') {
      const bio = await prisma.biography.upsert({
        where: { id: 'main' },
        update: {},
        create: { id: 'main', content: '' },
      })
      return res.status(200).json(bio)
    }

    if (req.method === 'PUT') {
      const parsed = validate(biographyUpdateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const bio = await prisma.biography.upsert({
        where: { id: 'main' },
        update: { ...parsed.data, photoUrls: parsed.data.photoUrls ?? [], updatedAt: new Date() },
        create: { id: 'main', content: parsed.data.content ?? '', ...parsed.data, photoUrls: parsed.data.photoUrls ?? [] },
      })
      await logActivity({ action: 'update', entity: 'biography', entityId: 'main', req })
      return res.status(200).json(bio)
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/biography]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
