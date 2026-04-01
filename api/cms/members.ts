/**
 * CMS Members API — 8 fixed slots (7 entities + 1 engineer).
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { shellMemberUpdateSchema } from '../_cms-schemas.js'
import { z } from 'zod'

const slotIndexSchema = z.coerce.number().int().min(0).max(7)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  const { slotIndex: slotParam } = req.query as Record<string, string>

  try {
    if (req.method === 'GET') {
      const members = await prisma.shellMember.findMany({ orderBy: { slotIndex: 'asc' } })
      return res.status(200).json(members)
    }

    if (req.method === 'PUT' && slotParam !== undefined) {
      const slotResult = slotIndexSchema.safeParse(slotParam)
      if (!slotResult.success) return res.status(400).json({ error: 'Invalid slotIndex' })
      const slotIndex = slotResult.data

      const parsed = validate(shellMemberUpdateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })

      const member = await prisma.shellMember.upsert({
        where: { slotIndex },
        update: { ...parsed.data, socialLinks: parsed.data.socialLinks ?? {} },
        create: { slotIndex, ...parsed.data, socialLinks: parsed.data.socialLinks ?? {} },
      })
      await logActivity({ action: 'update', entity: 'member', entityId: String(slotIndex), req })
      return res.status(200).json(member)
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/members]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
