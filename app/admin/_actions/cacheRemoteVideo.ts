'use server'

import { createHash } from 'node:crypto'
import { runAdminAction } from '@/app/admin/_actions/auth'
import { uploadBufferToR2 } from '@/app/admin/_actions/r2Upload'
import { MEDIA_BUCKET } from '@/lib/constants'
import {
  assertRemoteVideoSize,
  extensionFromVideoContentType,
  isAllowedVideoContentType,
  resolveRemoteVideoUrl,
} from '@/lib/remote-video-url'

export interface CacheRemoteVideoResult {
  ok: boolean
  storagePath?: string
  publicUrl?: string
  source?: 'direct' | 'google_drive'
  error?: string
}

function buildObjectPath(prefix: string, ext: string, sourceUrl: string): string {
  const hash = createHash('sha256').update(sourceUrl).digest('hex').slice(0, 12)
  const safePrefix = prefix.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'imports'
  return `${safePrefix}/${Date.now()}-${hash}.${ext}`
}

export async function cacheRemoteVideoToR2(
  sourceUrl: string,
  options?: { prefix?: string },
): Promise<CacheRemoteVideoResult> {
  const result = await runAdminAction(async () => {
    const resolved = resolveRemoteVideoUrl(sourceUrl)
    if (!resolved) {
      return { ok: false as const, error: 'Invalid or unsupported video URL' }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    try {
      const response = await fetch(resolved.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          Accept: 'video/*,application/octet-stream',
          'User-Agent': 'ZardonicAdmin/1.0',
        },
      })

      if (!response.ok) {
        return { ok: false as const, error: `Failed to download video (HTTP ${response.status})` }
      }

      const contentType = response.headers.get('content-type')
      if (!isAllowedVideoContentType(contentType)) {
        return {
          ok: false as const,
          error: 'URL did not return a video. For Google Drive, ensure the file is shared publicly.',
        }
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      assertRemoteVideoSize(buffer.byteLength)

      const ext = extensionFromVideoContentType(contentType)
      const prefix = options?.prefix ?? 'imports/videos'
      const objectPath = buildObjectPath(prefix, ext, resolved.url)

      const { publicUrl, objectPath: storedPath } = await uploadBufferToR2(
        MEDIA_BUCKET,
        objectPath,
        buffer,
        contentType?.split(';')[0].trim() ?? 'video/mp4',
      )

      return {
        ok: true as const,
        storagePath: storedPath,
        publicUrl,
        source: resolved.source,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { ok: false as const, error: 'Video download timed out' }
      }
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Failed to cache remote video',
      }
    } finally {
      clearTimeout(timeout)
    }
  }, 'Unable to cache remote video.')

  if ('error' in result && !('ok' in result)) {
    return { ok: false, error: result.error }
  }
  return result
}