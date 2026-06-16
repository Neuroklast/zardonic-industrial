import { resolve4, resolve6 } from 'node:dns/promises'
import { put } from '@vercel/blob'

const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20 MB
const MAX_FILENAME_LENGTH = 120
const MAX_REDIRECTS = 5
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
  // Blocks decimal integer hostnames such as 2130706433 (= 127.0.0.1).
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

function toDirectUrl(input: string): string {
  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    return input
  }

  if (parsed.hostname === 'drive.google.com') {
    const pathParts = parsed.pathname.split('/').filter(Boolean)
    if (pathParts[0] === 'file' && pathParts[1] === 'd' && pathParts[2]) {
      return `https://drive.google.com/uc?export=view&id=${pathParts[2]}`
    }

    if ((parsed.pathname === '/open' || parsed.pathname === '/uc') && parsed.searchParams.get('id')) {
      return `https://drive.google.com/uc?export=view&id=${parsed.searchParams.get('id')}`
    }
  }

  if (parsed.hostname === 'lh3.googleusercontent.com') {
    const pathParts = parsed.pathname.split('/').filter(Boolean)
    if (pathParts[0] === 'd' && pathParts[1]) {
      return `https://drive.google.com/uc?export=view&id=${pathParts[1]}`
    }
  }

  return input
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
  const safe = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+/, '').slice(0, MAX_FILENAME_LENGTH)
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

async function readResponseBuffer(response: Response, maxBytes: number): Promise<Buffer> {
  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > maxBytes) throw new Error('Image too large')
    return buffer
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error('Image too large')
    }
    chunks.push(value)
  }

  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
}

async function fetchValidatedImage(input: URL, redirectsRemaining = MAX_REDIRECTS): Promise<Response> {
  const response = await fetch(input.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlobImageImporter/1.0)' },
    redirect: 'manual',
  })

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirectsRemaining === 0) {
      throw new Error('Too many redirects')
    }

    const location = response.headers.get('location')
    if (!location) {
      throw new Error('Invalid redirect URL')
    }

    const nextUrl = assertAllowedRemoteUrl(new URL(location, input).toString())
    if (await hasBlockedResolvedIP(nextUrl.hostname)) {
      throw new Error('Blocked redirect target')
    }

    return fetchValidatedImage(nextUrl, redirectsRemaining - 1)
  }

  return response
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

  const response = await fetchValidatedImage(parsedDirect)

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

  const buffer = await readResponseBuffer(response, MAX_IMAGE_SIZE)

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
