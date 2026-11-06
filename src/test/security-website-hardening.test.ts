import { afterEach, describe, expect, it, vi } from 'vitest'
import { clientIpFrom } from '@/lib/rate-limit'
import { readResponseWithLimit } from '@/lib/limited-response-body'
import { fetchUrlWithResolvedCheck } from '@/lib/ssrf-guard'
import { safeAdminRedirect } from '@/lib/admin-login-redirect'
import { isValidContentObjectKey } from '@/lib/r2-object-key'
import { GET as reconcileGet } from '@/app/api/r2-reconcile/route'

const previousVercel = process.env.VERCEL

afterEach(() => {
  vi.unstubAllGlobals()
  if (previousVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = previousVercel
})

describe('website security regression coverage', () => {
  it('rejects media reconcile GET, including links and prefetches', async () => {
    const response = await reconcileGet()
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST')
  })

  it('rejects cross-site and ambiguous admin login return paths', () => {
    const origin = 'https://www.zardonic.net'
    expect(safeAdminRedirect('//attacker.example', origin)).toBe('/admin')
    expect(safeAdminRedirect('/\\\\attacker.example', origin)).toBe('/admin')
    expect(safeAdminRedirect('/admin/releases', origin)).toBe('/admin/releases')
  })

  it('does not trust client-authored forwarded-for identities', () => {
    process.env.VERCEL = '1'
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.8',
      'x-vercel-forwarded-for': '198.51.100.21',
    })
    expect(clientIpFrom(headers)).toBe('198.51.100.21')
    delete process.env.VERCEL
    expect(clientIpFrom(headers)).toBe('unknown-client')
  })

  it('cancels oversized upstream assets instead of buffering them', async () => {
    const response = new Response('123456789')
    await expect(readResponseWithLimit(response, 4)).rejects.toThrow(/permitted size/)
    await expect(readResponseWithLimit(new Response('ok'), 4)).resolves.toEqual(Buffer.from('ok'))
  })

  it('accepts hashed upload keys but rejects arbitrary storage paths', () => {
    expect(isValidContentObjectKey('partners/logos/' + 'a'.repeat(32) + '.webp')).toBe(true)
    expect(isValidContentObjectKey('private/secrets.txt')).toBe(false)
    expect(isValidContentObjectKey('uploads/../private/file.mp4')).toBe(false)
  })

  it('rejects a redirect from a public remote address to localhost', async () => {
    const fetchMock = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: 'http://127.0.0.1/internal' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchUrlWithResolvedCheck('https://93.184.216.34/public')).rejects.toThrow(/Blocked host/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
