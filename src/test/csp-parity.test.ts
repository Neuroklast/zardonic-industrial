import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function extractDirectiveHosts(csp: string, directive: string): string[] {
  const match = csp.match(new RegExp(`${directive}\\s+([^;]+)`))
  if (!match) return []
  return match[1].trim().split(/\s+/)
}

describe('CSP connect-src parity', () => {
  it('vercel.json and next.config.mjs allow the same connect-src hosts', () => {
    const root = resolve(__dirname, '../..')
    const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>
    }
    const nextConfig = readFileSync(resolve(root, 'next.config.mjs'), 'utf8')

    const vercelCsp = vercel.headers
      .flatMap((group) => group.headers)
      .find((h) => h.key === 'Content-Security-Policy')?.value
    expect(vercelCsp).toBeTruthy()

    const nextMatch = nextConfig.match(/connect-src 'self'([^`"]+)/)
    expect(nextMatch).toBeTruthy()

    const vercelHosts = extractDirectiveHosts(vercelCsp!, 'connect-src')
    const nextHosts = ['\'self\'', ...nextMatch![1].trim().split(/\s+/)]

    for (const host of nextHosts) {
      expect(vercelHosts).toContain(host)
    }

    expect(vercelHosts).toContain('https://*.r2.cloudflarestorage.com')
    expect(vercelHosts).toContain('https://*.r2.dev')
  })

  it('frame-src allows same-origin admin live preview iframe', () => {
    const root = resolve(__dirname, '../..')
    const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>
    }
    const nextConfig = readFileSync(resolve(root, 'next.config.mjs'), 'utf8')

    const vercelCsp = vercel.headers
      .flatMap((group) => group.headers)
      .find((h) => h.key === 'Content-Security-Policy')?.value
    expect(vercelCsp).toBeTruthy()

    const vercelFrameSrc = extractDirectiveHosts(vercelCsp!, 'frame-src')
    expect(vercelFrameSrc).toContain('\'self\'')

    const nextFrameMatch = nextConfig.match(/frame-src ([^`"]+)/)
    expect(nextFrameMatch).toBeTruthy()
    expect(nextFrameMatch![1]).toContain('\'self\'')

    const xfo = vercel.headers
      .flatMap((group) => group.headers)
      .find((h) => h.key === 'X-Frame-Options')?.value
    expect(xfo).toBe('SAMEORIGIN')
  })
})