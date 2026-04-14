import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { applyRateLimit } from '../_ratelimit.js'
import { validateSession } from '../auth.js'

// Disable Vercel's built-in body parser so we can stream the raw request body directly to Blob storage
export const config = { api: { bodyParser: false } }

const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // OWASP A07:2021 — Authentication check
  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  // OWASP A07:2021 — Rate limiting
  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  // Check that Vercel Blob storage is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: 'Service Unavailable',
      details: ['BLOB_READ_WRITE_TOKEN environment variable is not set. Please configure Vercel Blob storage.'],
    })
  }

  // Read pathname and content type from request headers
  const pathname = req.headers['x-blob-pathname']
  const contentType = req.headers['content-type']

  if (!pathname || typeof pathname !== 'string') {
    return res.status(400).json({ error: 'Missing x-blob-pathname header' })
  }

  if (!contentType || !ALLOWED_VIDEO_TYPES.includes(contentType)) {
    return res.status(400).json({
      error: 'Invalid content type',
      details: [`Content-Type must be one of: ${ALLOWED_VIDEO_TYPES.join(', ')}`],
    })
  }

  // Validate Content-Length against our size limit (if provided by client)
  const contentLength = req.headers['content-length']
  if (contentLength && parseInt(contentLength, 10) > MAX_VIDEO_SIZE) {
    return res.status(413).json({ error: 'File too large', details: [`Maximum file size is ${MAX_VIDEO_SIZE / 1024 / 1024} MB`] })
  }

  try {
    // Stream the request body directly to Vercel Blob storage — avoids buffering large files in memory
    const blob = await put(pathname, req, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('[cms/video-upload] upload completed:', blob.url)
    return res.json({ url: blob.url, pathname: blob.pathname })
  } catch (err) {
    console.error('[cms/video-upload] error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
