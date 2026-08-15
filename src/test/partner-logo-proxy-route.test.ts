import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/ssrf-guard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ssrf-guard')>()
  return {
    ...actual,
    assertSafeRemoteUrl: vi.fn(async (url: string) => new URL(url)),
  }
})

import { GET } from '@/app/api/partner-logo/route'

describe('GET /api/partner-logo', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('rejects non-allowlisted hosts', async () => {
    const res = await GET(
      new Request(
        `http://local.test/api/partner-logo?url=${encodeURIComponent('https://evil.example/a.svg')}`,
      ),
    )
    expect(res.status).toBe(400)
  })

  it('rejects missing url', async () => {
    const res = await GET(new Request('http://local.test/api/partner-logo'))
    expect(res.status).toBe(400)
  })

  it('rewrites an allowlisted SVG to hi-res', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          '<svg width="155" height="18" viewBox="0 0 155 18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
          { status: 200 },
        ),
      ),
    )

    const target = 'https://pub-example.r2.dev/partners/logos/baby.svg'
    const res = await GET(
      new Request(`http://local.test/api/partner-logo?url=${encodeURIComponent(target)}`),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/svg+xml')
    const text = await res.text()
    expect(text).toContain('width="1024"')
    expect(text).toContain('viewBox="0 0 155 18"')
  })

  it('rejects upstream non-svg bodies', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not-svg', { status: 200 })))
    const target = 'https://pub-example.r2.dev/partners/logos/baby.svg'
    const res = await GET(
      new Request(`http://local.test/api/partner-logo?url=${encodeURIComponent(target)}`),
    )
    expect(res.status).toBe(415)
  })
})
