import {
  extractGoogleDriveFileId,
  googleDriveDirectUrl,
  isAllowedRemoteHost,
} from '@/lib/remote-image-url'

const MAX_REMOTE_VIDEO_BYTES = 50 * 1024 * 1024

/** Normalize pasted URLs (incl. Google Drive) to a fetchable HTTPS video URL. */
export function resolveRemoteVideoUrl(input: string): { url: string; source: 'direct' | 'google_drive' } | null {
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

export function isAllowedVideoContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const normalized = contentType.split(';')[0].trim().toLowerCase()
  return (
    normalized === 'video/mp4' ||
    normalized === 'video/webm' ||
    normalized === 'video/quicktime' ||
    normalized === 'application/octet-stream'
  )
}

export function extensionFromVideoContentType(contentType: string | null): string {
  if (!contentType) return 'mp4'
  const normalized = contentType.split(';')[0].trim().toLowerCase()
  switch (normalized) {
    case 'video/webm':
      return 'webm'
    case 'video/quicktime':
      return 'mov'
    default:
      return 'mp4'
  }
}

export function assertRemoteVideoSize(byteLength: number): void {
  if (byteLength > MAX_REMOTE_VIDEO_BYTES) {
    throw new Error(`Video too large (max ${MAX_REMOTE_VIDEO_BYTES / (1024 * 1024)} MB)`)
  }
  if (byteLength === 0) {
    throw new Error('Downloaded video is empty')
  }
}

export const REMOTE_VIDEO_MAX_BYTES = MAX_REMOTE_VIDEO_BYTES