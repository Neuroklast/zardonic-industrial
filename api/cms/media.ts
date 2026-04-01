/**
 * CMS Media Library API — upload, list, and delete media files.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A04:2021 — Insecure Design: file type validation, size limits.
 * OWASP A05:2021 — Security Misconfiguration: MIME type enforcement.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, del } from '@vercel/blob'
import sharp from 'sharp'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { mediaUpdateSchema } from '../_cms-schemas.js'
import { z } from 'zod'

// OWASP A04:2021 — Only allow safe image MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
])

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB raw limit

const folderQuerySchema = z.object({
  folder: z.enum(['general', 'covers', 'flyers', 'press', 'members']).optional(),
  id: z.string().optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  const { id, folder } = req.query as Record<string, string>

  try {
    // GET — list media files
    if (req.method === 'GET') {
      const folderParsed = folderQuerySchema.safeParse({ folder, id })
      if (!folderParsed.success) return res.status(400).json({ error: 'Invalid query' })

      if (id) {
        const file = await prisma.mediaFile.findUnique({ where: { id } })
        if (!file) return res.status(404).json({ error: 'Not found' })
        return res.status(200).json(file)
      }

      const files = await prisma.mediaFile.findMany({
        where: folder ? { folder } : undefined,
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(files)
    }

    // POST — upload file
    if (req.method === 'POST') {
      // Vercel handles multipart/form-data parsing
      const body = req.body as {
        filename?: string
        mimeType?: string
        folder?: string
        alt?: string
        data?: string // base64 encoded file data
      }

      if (!body.filename || !body.mimeType || !body.data) {
        return res.status(400).json({ error: 'filename, mimeType, and data are required' })
      }

      // OWASP A04:2021 — Validate MIME type whitelist
      if (!ALLOWED_MIME_TYPES.has(body.mimeType)) {
        return res.status(400).json({ error: 'File type not allowed' })
      }

      const fileBuffer = Buffer.from(body.data, 'base64')

      // OWASP A04:2021 — Enforce file size limit
      if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
        return res.status(413).json({ error: 'File too large (max 20 MB)' })
      }

      const targetFolder = body.folder ?? 'general'
      const originalName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_') // OWASP A03:2021 — sanitize filename
      const uniqueName = `${Date.now()}-${originalName}`

      let processedBuffer = fileBuffer
      let width: number | undefined
      let height: number | undefined
      let thumbnailUrl: string | undefined
      let webpUrl: string | undefined

      // Process images with Sharp (resize, convert to WebP)
      if (body.mimeType.startsWith('image/') && body.mimeType !== 'image/svg+xml') {
        try {
          const meta = await sharp(fileBuffer).metadata()
          width = meta.width
          height = meta.height

          // Resize if wider than 2048px, quality 85%
          if (meta.width && meta.width > 2048) {
            processedBuffer = await sharp(fileBuffer).resize({ width: 2048 }).jpeg({ quality: 85 }).toBuffer()
          }

          // Generate WebP version
          const webpBuffer = await sharp(fileBuffer).resize({ width: Math.min(meta.width ?? 2048, 2048) }).webp({ quality: 85 }).toBuffer()
          const webpName = uniqueName.replace(/\.[^.]+$/, '.webp')

          if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(503).json({ error: 'Media storage not configured' })
          }

          const webpBlob = await put(`${targetFolder}/${webpName}`, webpBuffer, {
            access: 'public',
            contentType: 'image/webp',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })
          webpUrl = webpBlob.url

          // Generate thumbnail (200x200)
          const thumbBuffer = await sharp(fileBuffer).resize({ width: 200, height: 200, fit: 'cover' }).jpeg({ quality: 75 }).toBuffer()
          const thumbName = `thumb-${uniqueName.replace(/\.[^.]+$/, '.jpg')}`
          const thumbBlob = await put(`${targetFolder}/thumbnails/${thumbName}`, thumbBuffer, {
            access: 'public',
            contentType: 'image/jpeg',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })
          thumbnailUrl = thumbBlob.url
        } catch {
          // Non-fatal — proceed without image processing
        }
      }

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(503).json({ error: 'Media storage not configured' })
      }

      // Upload original/processed file to Vercel Blob
      const blob = await put(`${targetFolder}/${uniqueName}`, processedBuffer, {
        access: 'public',
        contentType: body.mimeType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      const mediaFile = await prisma.mediaFile.create({
        data: {
          filename: uniqueName,
          originalName: body.filename,
          mimeType: body.mimeType,
          size: processedBuffer.length,
          width,
          height,
          url: blob.url,
          thumbnailUrl,
          webpUrl,
          alt: body.alt ?? null,
          folder: targetFolder,
        },
      })

      await logActivity({ action: 'upload', entity: 'media', entityId: mediaFile.id, req })
      return res.status(201).json(mediaFile)
    }

    // PATCH — update alt text / folder
    if (req.method === 'PATCH' && id) {
      const parsed = validate(mediaUpdateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const file = await prisma.mediaFile.update({ where: { id }, data: parsed.data })
      return res.status(200).json(file)
    }

    // DELETE — remove file from blob storage and DB
    if (req.method === 'DELETE' && id) {
      const file = await prisma.mediaFile.findUnique({ where: { id } })
      if (!file) return res.status(404).json({ error: 'Not found' })

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          await del(file.url, { token: process.env.BLOB_READ_WRITE_TOKEN })
          if (file.thumbnailUrl) await del(file.thumbnailUrl, { token: process.env.BLOB_READ_WRITE_TOKEN })
          if (file.webpUrl) await del(file.webpUrl, { token: process.env.BLOB_READ_WRITE_TOKEN })
        } catch {
          // Non-fatal — continue with DB deletion
        }
      }

      await prisma.mediaFile.delete({ where: { id } })
      await logActivity({ action: 'delete', entity: 'media', entityId: id, req })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/media]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
