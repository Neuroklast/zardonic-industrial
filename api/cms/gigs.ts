/**
 * CMS Gigs API — CRUD for tour dates.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { gigCreateSchema, gigUpdateSchema } from '../_cms-schemas.js'

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
    if (req.method === 'GET' && !id) {
      const gigs = await prisma.gig.findMany({ orderBy: { date: 'asc' } })
      return res.status(200).json(gigs)
    }

    if (req.method === 'GET' && id) {
      const gig = await prisma.gig.findUnique({ where: { id } })
      if (!gig) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(gig)
    }

    if (req.method === 'POST') {
      const parsed = validate(gigCreateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const gig = await prisma.gig.create({
        data: { ...parsed.data, date: new Date(parsed.data.date) },
      })
      await logActivity({ action: 'create', entity: 'gig', entityId: gig.id, req })
      return res.status(201).json(gig)
    }

    if (req.method === 'PUT' && id) {
      const parsed = validate(gigUpdateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const data: Record<string, unknown> = { ...parsed.data }
      if (parsed.data.date) data['date'] = new Date(parsed.data.date)
      const gig = await prisma.gig.update({ where: { id }, data })
      await logActivity({ action: 'update', entity: 'gig', entityId: id, req })
      return res.status(200).json(gig)
    }

    if (req.method === 'DELETE' && id) {
      await prisma.gig.delete({ where: { id } })
      await logActivity({ action: 'delete', entity: 'gig', entityId: id, req })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/gigs]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
