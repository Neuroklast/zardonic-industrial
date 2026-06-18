import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

// ── Strictly-typed shared state ─────────────────────────────────────────────
type CookieOptions = { path?: string; httpOnly?: boolean; secure?: boolean; sameSite?: string; maxAge?: number }
type CookieToSet = { name: string; value: string; options?: CookieOptions }
type AuthHeaders = Record<string, string>

const {
  mockSignIn,
  mockCookiesToSet,
  mockAuthHeaders,
} = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockCookiesToSet: [] as CookieToSet[],
  mockAuthHeaders: {} as AuthHeaders,
}))

// ── Mock @supabase/ssr ───────────────────────────────────────────────────────
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(
    (
      _url: string,
      _anonKey: string,
      options: { cookies: { setAll: (cookies: CookieToSet[], headers: AuthHeaders) => void } },
    ) => ({
      auth: {
        signInWithPassword: async (_creds: { email: string; password: string }) => {
          // Emit the queued cookies before returning (simulates token write)
          if (mockCookiesToSet.length > 0) {
            options.cookies.setAll(mockCookiesToSet, mockAuthHeaders)
          }
          return mockSignIn()
        },
      },
    }),
  ),
}))

import { POST } from '@/app/admin/login/submit/route'

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildRequest(
  fields: Record<string, string>,
  baseUrl = 'https://example.com',
): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value)
  }
  return new Request(`${baseUrl}/admin/login/submit`, {
    method: 'POST',
    body: formData,
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('POST /admin/login/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookiesToSet.length = 0
    // Reset auth headers to empty
    for (const key of Object.keys(mockAuthHeaders)) {
      delete mockAuthHeaders[key]
    }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  // ── Config guard ────────────────────────────────────────────────────────
  it('redirects to /admin/login?error=config when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const req = buildRequest({ email: 'a@b.com', password: 'pw' })
    const res = await POST(req as Parameters<typeof POST>[0])

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/admin/login?error=config')
  })

  // ── Error path ──────────────────────────────────────────────────────────
  it('redirects to /admin/login with ?msg and ?redirect on signIn error', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })

    const req = buildRequest({
      email: 'a@b.com',
      password: 'bad',
      redirectTo: '/admin/releases',
    })
    const res = await POST(req as Parameters<typeof POST>[0])

    expect(res.status).toBe(303)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/admin/login')
    expect(location).toContain('msg=Invalid+login+credentials')
    expect(location).toContain('redirect=%2Fadmin%2Freleases')
  })

  // ── Success path: chunked cookies written with Supabase-provided options ─
  it('writes all chunked cookies with Supabase-provided options (not overridden)', async () => {
    const chunk0Options: CookieOptions = { path: '/', httpOnly: false, secure: true, sameSite: 'lax', maxAge: 34560000 }
    const chunk1Options: CookieOptions = { path: '/', httpOnly: false, secure: true, sameSite: 'lax', maxAge: 34560000 }

    mockCookiesToSet.push(
      { name: 'sb-test-auth-token.0', value: 'chunk-value-0', options: chunk0Options },
      { name: 'sb-test-auth-token.1', value: 'chunk-value-1', options: chunk1Options },
    )
    mockSignIn.mockResolvedValue({ error: null })

    const req = buildRequest({
      email: 'admin@example.com',
      password: 'correct',
      redirectTo: '/admin/releases',
    })
    const res = await POST(req as Parameters<typeof POST>[0])

    // Should be a success 303 redirect to the target
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('/admin/releases')

    // Both chunk cookies must appear in the Set-Cookie headers
    const setCookieHeaders = res.headers.getSetCookie?.() ?? []
    const cookieNames = setCookieHeaders.map((h) => h.split('=')[0])
    expect(cookieNames).toContain('sb-test-auth-token.0')
    expect(cookieNames).toContain('sb-test-auth-token.1')

    // Chunk 0: Supabase provides httpOnly=false → must NOT be overridden to true
    const chunk0Header = setCookieHeaders.find((h) => h.startsWith('sb-test-auth-token.0='))
    expect(chunk0Header).toBeDefined()
    expect(chunk0Header).toContain('chunk-value-0')
    // httpOnly: false means the attribute should be absent
    expect(chunk0Header?.toLowerCase()).not.toContain('httponly')

    // Chunk 1: same assertions
    const chunk1Header = setCookieHeaders.find((h) => h.startsWith('sb-test-auth-token.1='))
    expect(chunk1Header).toBeDefined()
    expect(chunk1Header).toContain('chunk-value-1')
    expect(chunk1Header?.toLowerCase()).not.toContain('httponly')
  })

  // ── Success path: default redirectTo is /admin ───────────────────────────
  it('redirects to /admin when no redirectTo field is provided', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    const req = buildRequest({ email: 'admin@example.com', password: 'correct' })
    const res = await POST(req as Parameters<typeof POST>[0])

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('/admin')
  })

  // ── Success path: cookies with httpOnly=true are written correctly ────────
  it('writes cookies with httpOnly=true when Supabase provides that option', async () => {
    const cookieOptions: CookieOptions = { path: '/', httpOnly: true, secure: true, sameSite: 'lax' }
    mockCookiesToSet.push(
      { name: 'sb-test-auth-token.0', value: 'value-a', options: cookieOptions },
    )
    mockSignIn.mockResolvedValue({ error: null })

    const req = buildRequest({ email: 'admin@example.com', password: 'correct' })
    const res = await POST(req as Parameters<typeof POST>[0])

    const setCookieHeaders = res.headers.getSetCookie?.() ?? []
    const chunk0Header = setCookieHeaders.find((h) => h.startsWith('sb-test-auth-token.0='))
    expect(chunk0Header).toBeDefined()
    expect(chunk0Header?.toLowerCase()).toContain('httponly')
  })

  // ── Success path: @supabase/ssr ≥ 0.12 cache-control headers applied ──────
  it('applies cache-control headers from @supabase/ssr to the response', async () => {
    mockCookiesToSet.push(
      { name: 'sb-test-auth-token.0', value: 'value', options: { path: '/', httpOnly: false, secure: true, sameSite: 'lax' } },
    )
    // Simulate the headers that @supabase/ssr 0.12+ passes as the second arg
    mockAuthHeaders['Cache-Control'] = 'private, no-cache, no-store, must-revalidate, max-age=0'
    mockAuthHeaders['Expires'] = '0'
    mockAuthHeaders['Pragma'] = 'no-cache'
    mockSignIn.mockResolvedValue({ error: null })

    const req = buildRequest({ email: 'admin@example.com', password: 'correct' })
    const res = await POST(req as Parameters<typeof POST>[0])

    expect(res.status).toBe(303)
    expect(res.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0',
    )
    expect(res.headers.get('expires')).toBe('0')
    expect(res.headers.get('pragma')).toBe('no-cache')
  })
})
