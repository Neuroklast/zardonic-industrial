const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024

import { isBlockedHost } from '@/lib/ssrf-guard'

export function extractGoogleDriveFileId(url: string): string | null {
  const trimmed = url.trim()
  const filePath = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (filePath?.[1]) return filePath[1]

  const openId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openId?.[1] && trimmed.includes('drive.google.com')) return openId[1]

  const ucId = trimmed.match(/drive\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/)
  if (ucId?.[1]) return ucId[1]

  return null
}

export function googleDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

/** Normalize pasted URLs (incl. Google Drive share links) to a fetchable HTTPS image URL. */
export function resolveRemoteImageUrl(input: string): { url: string; source: 'direct' | 'google_drive' } | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const driveId = extractGoogleDriveFileId(trimmed)
  if (driveId) {
    return { url: googleDriveDirectUrl(driveId), source: 'google_drive' }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:') return null
    if (!isAllowedRemoteHost(parsed.hostname)) return null
    return { url: parsed.toString(), source: 'direct' }
  } catch {
    return null
  }
}

export function isAllowedRemoteHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host.endsWith('.local')) return false
  return !isBlockedHost(host)
}

export function isAllowedImageContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const normalized = contentType.split(';')[0].trim().toLowerCase()
  return (
    normalized === 'image/jpeg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp' ||
    normalized === 'image/gif' ||
    normalized === 'image/svg+xml' ||
    normalized === 'image/x-icon' ||
    normalized === 'application/octet-stream'
  )
}

export function extensionFromContentType(contentType: string | null): string {
  if (!contentType) return 'jpg'
  const normalized = contentType.split(';')[0].trim().toLowerCase()
  switch (normalized) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/svg+xml':
      return 'svg'
    case 'image/x-icon':
      return 'ico'
    default:
      return 'jpg'
  }
}

export function assertRemoteImageSize(byteLength: number): void {
  if (byteLength > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error(`Image too large (max ${MAX_REMOTE_IMAGE_BYTES / (1024 * 1024)} MB)`)
  }
  if (byteLength === 0) {
    throw new Error('Downloaded image is empty')
  }
}

export const REMOTE_IMAGE_MAX_BYTES = MAX_REMOTE_IMAGE_BYTES