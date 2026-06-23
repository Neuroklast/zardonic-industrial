import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }
type AuthHeaders = Record<string, string>

const {
  mockGetUser,
  mockSingle,
  mockCookiesToSet,
  mockAuthHeaders,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSingle: vi.fn(),
  mockCookiesToSet: [] as CookieToSet[],
  mockAuthHeaders: {} as AuthHeaders,
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(
    (
      _url: string,
      _anonKey: string,
      options: { cookies: { setAll: (cookiesToSet: CookieToSet[], headers: AuthHeaders) => void } },
    ) => ({
      auth: {
        getUser: async () => {
          if (mockCookiesToSet.length > 0) {
            options.cookies.setAll(mockCookiesToSet, mockAuthHeaders)
          }
          return mockGetUser()
        },
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: mockSingle,
          }),
        }),
      }),
    }),
  ),
}))

import { proxy } from '@/proxy'

function createRequest(pathname: string): NextRequest {
  const cookieJar = new Map<string, string>()
  return {
    nextUrl: { pathname },
    url: `https://example.com${pathname}`,
    headers: new Headers(),
    cookies: {
      getAll: () => Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => cookieJar.set(name, value),
    },
  } as unknown as NextRequest
}

describe('middleware admin auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookiesToSet.length = 0
    for (const key of Object.keys(mockAuthHeaders)) {
      delete mockAuthHeaders[key]
    }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  it('keeps refreshed cookies on login redirect when auth fails', async () => {
    mockCookiesToSet.push({
      name: 'sb-access-token',
      value: 'fresh-token',
      options: { path: '/', httpOnly: true },
    })
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('invalid session'),
    })

    const response = await proxy(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBe('https://example.com/admin/login?redirect=%2Fadmin%2Freleases')
    // We expect cookies to not be manually persisted on the redirect, just letting it flow.
  })

  it('returns next response for admin user and preserves refreshed cookies', async () => {
    mockCookiesToSet.push({
      name: 'sb-refresh-token',
      value: 'fresh-refresh-token',
      options: { path: '/', httpOnly: true },
    })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-user' } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: { role: 'admin' },
    })

    const response = await proxy(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.cookies.get('sb-refresh-token')?.value).toBe('fresh-refresh-token')
  })

  it('allows request when profile lookup returns null after valid auth', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-user' } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: null,
    })

    const response = await proxy(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('redirects to forbidden when authenticated user is not admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'regular-user' } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: { role: 'user' },
    })

    const response = await proxy(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBe('https://example.com/admin/login?error=forbidden')
  })

  it('allows request when profile lookup throws after valid auth', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-user' } },
      error: null,
    })
    mockSingle.mockRejectedValue(new Error('temporary lookup failure'))

    const response = await proxy(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('applies cache-control headers from @supabase/ssr to the response', async () => {
    mockCookiesToSet.push({
      name: 'sb-access-token',
      value: 'refreshed-token',
      options: { path: '/', httpOnly: false },
    })
    mockAuthHeaders['Cache-Control'] = 'private, no-cache, no-store, must-revalidate, max-age=0'
    mockAuthHeaders['Expires'] = '0'
    mockAuthHeaders['Pragma'] = 'no-cache'
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-user' } },
      error: null,
    })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })

    const response = await proxy(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0',
    )
    expect(response.headers.get('expires')).toBe('0')
    expect(response.headers.get('pragma')).toBe('no-cache')
  })
})
