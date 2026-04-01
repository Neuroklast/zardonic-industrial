/**
 * CMS Publish API — publish or unpublish any content type.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { publishSchema } from '../_cms-schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const parsed = validate(publishSchema, req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error })

  const { entity, id, action } = parsed.data
  const isPublishing = action === 'publish'
  const now = new Date()

  try {
    switch (entity) {
      case 'release':
        await prisma.release.update({
          where: { id },
          data: { isDraft: !isPublishing, publishedAt: isPublishing ? now : null },
        })
        break

      case 'gig':
        await prisma.gig.update({
          where: { id },
          data: { isDraft: !isPublishing, publishedAt: isPublishing ? now : null },
        })
        break

      case 'video':
        await prisma.video.update({
          where: { id },
          data: { isDraft: !isPublishing, publishedAt: isPublishing ? now : null },
        })
        break

      case 'news':
        await prisma.newsPost.update({
          where: { id },
          data: { isDraft: !isPublishing, publishedAt: isPublishing ? now : null },
        })
        break

      case 'biography': {
        if (isPublishing) {
          const bio = await prisma.biography.findUnique({ where: { id: 'main' } })
          if (!bio) return res.status(404).json({ error: 'Biography not found' })
          await prisma.biography.update({
            where: { id: 'main' },
            data: {
              isDraft: false,
              publishedContent: bio.content,
              publishedAt: now,
            },
          })
        } else {
          await prisma.biography.update({
            where: { id: 'main' },
            data: { isDraft: true },
          })
        }
        break
      }

      case 'section': {
        if (isPublishing) {
          const section = await prisma.section.findUnique({ where: { id } })
          if (!section) return res.status(404).json({ error: 'Section not found' })
          await prisma.section.update({
            where: { id },
            data: {
              isDraft: false,
              publishedContent: section.content,
              publishedAt: now,
            },
          })
        } else {
          await prisma.section.update({
            where: { id },
            data: { isDraft: true },
          })
        }
        break
      }

      default:
        return res.status(400).json({ error: 'Unknown entity type' })
    }

    await logActivity({ action, entity, entityId: id, req })
    return res.status(200).json({ ok: true, action, entity, id })
  } catch (err) {
    console.error('[cms/publish]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
