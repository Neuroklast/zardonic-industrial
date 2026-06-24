import { resolve4, resolve6 } from 'node:dns/promises'

export const BLOCKED_HOST_PATTERNS = [
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
]

export const BLOCKED_IP_PATTERNS = [
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
]

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export function isBlockedHost(hostname: string): boolean {
  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) return true
  if (/^\d+$/.test(hostname)) return true
  if (!hostname.includes('.') && !hostname.startsWith('[')) return true
  return false
}

export function isBlockedResolvedIp(ip: string): boolean {
  return BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(ip))
}

export async function resolvePublicAddresses(hostname: string): Promise<string[]> {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.startsWith('[')) {
    return [hostname]
  }

  const [ipv4, ipv6] = await Promise.all([
    resolve4(hostname).catch(() => [] as string[]),
    resolve6(hostname).catch(() => [] as string[]),
  ])

  return [...ipv4, ...ipv6]
}

export async function assertSafeRemoteUrl(url: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error('Invalid URL protocol')
  }

  if (isBlockedHost(parsed.hostname)) {
    throw new Error('Blocked host')
  }

  const addresses = await resolvePublicAddresses(parsed.hostname)
  if (addresses.length === 0) {
    throw new Error('Blocked host')
  }

  if (addresses.some((ip) => isBlockedResolvedIp(ip))) {
    throw new Error('Blocked host')
  }

  return parsed
}

export async function fetchUrlWithResolvedCheck(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  await assertSafeRemoteUrl(url)
  return fetch(url, init)
}