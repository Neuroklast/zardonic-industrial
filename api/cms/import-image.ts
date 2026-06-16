import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyRateLimit } from '../_ratelimit.js'
import { validateSession } from '../auth.js'
import { importRemoteImageToBlob } from '../_remote-image.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required.' })
  }

  try {
    const result = await importRemoteImageToBlob(url)
    return res.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image import failed.'
    const status =
      message === 'Invalid URL' ||
      message === 'Invalid URL protocol' ||
      message === 'Blocked host' ||
      message === 'Blocked redirect target' ||
      message === 'Unsupported content type'
        ? 400
        : message === 'Image too large'
          ? 413
          : message === 'BLOB_READ_WRITE_TOKEN environment variable is not set.'
            ? 503
            : /^Upstream returned \d+$/.test(message)
              ? 502
              : 500
    return res.status(status).json({ error: message })
  }
}
