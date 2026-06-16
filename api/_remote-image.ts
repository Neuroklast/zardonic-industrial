import { resolve4, resolve6 } from 'node:dns/promises'
import { put } from '@vercel/blob'

const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20 MB
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^\[::1\]/,
  /^\[::ffff:/i,
  /^\[fe80:/i,
  /^\[fc/i,
  /^\[fd/i,
  /^metadata\.google\.internal$/i,
  /^0x[0-9a-f]+$/i,
  /^0[0-7]+\./,
] as const
const BLOCKED_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i,
  /^fe80:/i,
  /^fc/i,
  /^fd/i,
] as const
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
}

function isBlockedHost(hostname: string): boolean {
  if (BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(hostname))) return true
  if (/^\d+$/.test(hostname)) return true
  if (!hostname.includes('.') && !hostname.startsWith('[')) return true
  return false
}

async function hasBlockedResolvedIP(hostname: string): Promise<boolean> {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.startsWith('[')) return false
  try {
    const [ipv4, ipv6] = await Promise.all([
      resolve4(hostname).catch(() => [] as string[]),
      resolve6(hostname).catch(() => [] as string[]),
    ])
    return [...ipv4, ...ipv6].some(ip => BLOCKED_IP_PATTERNS.some(pattern => pattern.test(ip)))
  } catch {
    return false
  }
}

function toDirectUrl(url: string): string {
  const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (driveFile) return `https://drive.google.com/uc?export=view&id=${driveFile[1]}`
  const driveOpen = url.match(/drive\.google\.com\/open\?id=([^&#]+)/)
  if (driveOpen) return `https://drive.google.com/uc?export=view&id=${driveOpen[1]}`
  const driveUc = url.match(/drive\.google\.com\/uc\?[^#]*?id=([^&#]+)/)
  if (driveUc) return `https://drive.google.com/uc?export=view&id=${driveUc[1]}`
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([^/?#]+)/)
  if (lh3Match) return `https://drive.google.com/uc?export=view&id=${lh3Match[1]}`
  return url
}

function assertAllowedRemoteUrl(input: string): URL {
  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error('Invalid URL protocol')
  }
  if (isBlockedHost(parsed.hostname)) {
    throw new Error('Blocked host')
  }
  return parsed
}

function sanitizeFileName(baseName: string): string {
  const safe = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+/, '').slice(0, 120)
  return safe || 'image'
}

function extensionFromContentType(contentType: string): string {
  return CONTENT_TYPE_EXTENSIONS[contentType.toLowerCase()] ?? 'bin'
}

function buildBlobPath(finalUrl: URL, contentType: string): string {
  const pathName = finalUrl.pathname.split('/').pop() ?? ''
  const rawName = sanitizeFileName(pathName.replace(/\.[a-z0-9]+$/i, ''))
  const ext = extensionFromContentType(contentType)
  return `images/imported/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${rawName}.${ext}`
}

export interface ImportedImageResult {
  url: string
  fileName: string
  mimeType: string
  size: number
}

export async function importRemoteImageToBlob(remoteUrl: string): Promise<ImportedImageResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set.')
  }

  const directUrl = toDirectUrl(remoteUrl)
  const parsedDirect = assertAllowedRemoteUrl(directUrl)
  if (await hasBlockedResolvedIP(parsedDirect.hostname)) {
    throw new Error('Blocked host')
  }

  const response = await fetch(parsedDirect.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlobImageImporter/1.0)' },
    redirect: 'follow',
  })

  const finalUrl = assertAllowedRemoteUrl(response.url || parsedDirect.toString())
  if (await hasBlockedResolvedIP(finalUrl.hostname)) {
    throw new Error('Blocked redirect target')
  }

  if (!response.ok) {
    throw new Error(`Upstream returned ${response.status}`)
  }

  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (!contentType.startsWith('image/')) {
    throw new Error('Unsupported content type')
  }

  const contentLength = Number.parseInt(response.headers.get('content-length') || '0', 10)
  if (contentLength > MAX_IMAGE_SIZE) {
    throw new Error('Image too large')
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    throw new Error('Image too large')
  }

  const pathname = buildBlobPath(finalUrl, contentType)
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return {
    url: blob.url,
    fileName: pathname.split('/').pop() ?? pathname,
    mimeType: contentType,
    size: buffer.byteLength,
  }
}
