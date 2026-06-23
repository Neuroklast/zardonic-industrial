'use server'

import { createHash } from 'node:crypto'
import { runAdminAction } from '@/app/admin/_actions/auth'
import { uploadBufferToR2 } from '@/app/admin/_actions/r2Upload'
import { MEDIA_BUCKET } from '@/lib/constants'
import {
  assertRemoteImageSize,
  extensionFromContentType,
  isAllowedImageContentType,
  resolveRemoteImageUrl,
} from '@/lib/remote-image-url'

export interface CacheRemoteImageResult {
  ok: boolean
  storagePath?: string
  publicUrl?: string
  source?: 'direct' | 'google_drive' | 'upload'
  error?: string
}

function buildObjectPath(prefix: string, ext: string, sourceUrl: string): string {
  const hash = createHash('sha256').update(sourceUrl).digest('hex').slice(0, 12)
  const safePrefix = prefix.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'imports'
  return `${safePrefix}/${Date.now()}-${hash}.${ext}`
}

export async function cacheRemoteImageToR2(
  sourceUrl: string,
  options?: { prefix?: string },
): Promise<CacheRemoteImageResult> {
  const result = await runAdminAction(async () => {
    const resolved = resolveRemoteImageUrl(sourceUrl)
    if (!resolved) {
      return { ok: false as const, error: 'Invalid or unsupported image URL' }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)

    try {
      const response = await fetch(resolved.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          Accept: 'image/*,application/octet-stream',
          'User-Agent': 'ZardonicAdmin/1.0',
        },
      })

      if (!response.ok) {
        return { ok: false as const, error: `Failed to download image (HTTP ${response.status})` }
      }

      const contentType = response.headers.get('content-type')
      if (!isAllowedImageContentType(contentType)) {
        return {
          ok: false as const,
          error: 'URL did not return an image. For Google Drive, ensure the file is shared publicly.',
        }
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      assertRemoteImageSize(buffer.byteLength)

      const ext = extensionFromContentType(contentType)
      const prefix = options?.prefix ?? 'imports'
      const objectPath = buildObjectPath(prefix, ext, resolved.url)

      const { publicUrl, objectPath: storedPath } = await uploadBufferToR2(
        MEDIA_BUCKET,
        objectPath,
        buffer,
        contentType?.split(';')[0].trim() ?? 'image/jpeg',
      )

      return {
        ok: true as const,
        storagePath: storedPath,
        publicUrl,
        source: resolved.source,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { ok: false as const, error: 'Image download timed out' }
      }
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Failed to cache remote image',
      }
    } finally {
      clearTimeout(timeout)
    }
  }, 'Unable to cache remote image.')

  if ('error' in result && !('ok' in result)) {
    return { ok: false, error: result.error }
  }
  return result
}