'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import {
  assertRemoteImageSize,
  isAllowedImageContentType,
  resolveRemoteImageUrl,
} from '@/lib/remote-image-url'
import { shouldOpenImageEditor } from '@/lib/image-crop-math'

export interface FetchRemoteImageForEditResult {
  ok: boolean
  dataUrl?: string
  mimeType?: string
  canEdit?: boolean
  error?: string
}

export async function fetchRemoteImageForEdit(
  sourceUrl: string,
): Promise<FetchRemoteImageForEditResult> {
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

      const mimeType = contentType?.split(';')[0].trim().toLowerCase() ?? 'image/jpeg'
      const buffer = Buffer.from(await response.arrayBuffer())
      assertRemoteImageSize(buffer.byteLength)

      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
      return {
        ok: true as const,
        dataUrl,
        mimeType,
        canEdit: shouldOpenImageEditor(mimeType),
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { ok: false as const, error: 'Image download timed out' }
      }
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Failed to fetch remote image',
      }
    } finally {
      clearTimeout(timeout)
    }
  }, 'Unable to fetch remote image.')

  if ('error' in result && !('ok' in result)) {
    return { ok: false, error: result.error }
  }
  return result
}