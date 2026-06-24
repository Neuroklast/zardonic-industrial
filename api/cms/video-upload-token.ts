import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { applyRateLimit } from '../_ratelimit.js'
import { getApiSecret, isApiSecretConfigured } from '../_api-secrets.js'
import { validateSession } from '../auth.js'

const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB
const ALLOWED_MEDIA_TYPES = [
  'video/mp4',
  'video/webm',
  // 3D model formats for the ModelBackground component
  'model/gltf-binary',   // .glb
  'model/gltf+json',     // .gltf
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  if (!(await isApiSecretConfigured('blob_read_write_token'))) {
    return res.status(503).json({
      error: 'Service Unavailable',
      details: ['Vercel Blob token is not configured. Set it in Admin → API Keys.'],
    })
  }

  const blobToken = await getApiSecret('blob_read_write_token')
  if (!blobToken) {
    return res.status(503).json({ error: 'Service Unavailable' })
  }

  try {
    const jsonResponse = await handleUpload({
      token: blobToken,
      request: req,
      body: req.body as HandleUploadBody,
      onBeforeGenerateToken: async (_pathname: string) => {
        return {
          allowedContentTypes: ALLOWED_MEDIA_TYPES,
          maximumSizeInBytes: MAX_VIDEO_SIZE,
        }
      },
      onUploadCompleted: async ({ blob }: { blob: { url: string } }) => {
        console.log('[cms/video-upload-token] upload completed:', blob.url)
      },
    })
    return res.json(jsonResponse)
  } catch (err) {
    console.error('[cms/video-upload-token] error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
