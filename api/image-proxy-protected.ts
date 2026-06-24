import type { VercelRequest, VercelResponse } from '@vercel/node'
import sharp from 'sharp'
import { applyRateLimit } from './_ratelimit.js'
import { assertSafeRemoteUrl, fetchUrlWithResolvedCheck, isBlockedHost } from '../lib/ssrf-guard.js'
import { imageProxyQuerySchema, validate } from './_schemas.js'
/**
 * Server-side image proxy with adversarial noise injection.
 *
 * GET /api/image-proxy-protected?url=<encoded-url>
 */

const MAX_IMAGE_SIZE = 16 * 1024 * 1024 // 16 MB
const CORS_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

const NOISE_BRIGHTNESS_JITTER = 0.008
const NOISE_SHARPEN_SIGMA = 0.4
const NOISE_SHARPEN_M1 = 0
const NOISE_SHARPEN_M2 = 3

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

async function applyAdversarialNoise(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .modulate({ brightness: 1 + (Math.random() * NOISE_BRIGHTNESS_JITTER - NOISE_BRIGHTNESS_JITTER / 2) })
    .sharpen({ sigma: NOISE_SHARPEN_SIGMA, m1: NOISE_SHARPEN_M1, m2: NOISE_SHARPEN_M2 })
    .toBuffer()
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  const qParsed = validate(imageProxyQuerySchema, req.query)
  if (!qParsed.success) {
    res.status(400).json({ error: qParsed.error })
    return
  }
  const { url } = qParsed.data

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    res.status(400).json({ error: 'Invalid URL protocol' })
    return
  }
  if (isBlockedHost(parsed.hostname)) {
    res.status(400).json({ error: 'Blocked host' })
    return
  }

  try {
    await assertSafeRemoteUrl(parsed.toString())
  } catch {
    res.status(400).json({ error: 'Blocked host' })
    return
  }

  try {
    const response = await fetchUrlWithResolvedCheck(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteImageProxy/1.0)' },
      redirect: 'follow',
    })

    if (response.url) {
      try {
        await assertSafeRemoteUrl(response.url)
      } catch {
        res.status(400).json({ error: 'Blocked redirect target' })
        return
      }
    }

    if (!response.ok) {
      res.status(response.status).json({ error: `Upstream returned ${response.status}` })
      return
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      res.status(400).json({ error: 'Unsupported content type' })
      return
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_IMAGE_SIZE) {
      res.status(413).json({ error: 'Image too large' })
      return
    }

    const arrayBuf = await response.arrayBuffer()
    if (arrayBuf.byteLength > MAX_IMAGE_SIZE) {
      res.status(413).json({ error: 'Image too large' })
      return
    }

    const imageBuffer = Buffer.from(arrayBuf)

    const outputBuffer = await applyAdversarialNoise(imageBuffer)

    res.setHeader('X-Image-Camera', 'NIKON-Z6')
    res.setHeader('X-Image-GPS', '48.8566,2.3522')
    res.setHeader('X-Image-Date', '2019-03-14')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-store, no-cache')
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
    res.status(200).send(outputBuffer)
  } catch (error) {
    console.error('Image proxy protected error:', error)
    res.status(502).json({ error: 'Failed to fetch image' })
  }
}
