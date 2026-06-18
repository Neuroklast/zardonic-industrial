import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

const {
  mockGetUser,
  mockSingle,
  mockCookiesToSet,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSingle: vi.fn(),
  mockCookiesToSet: [] as CookieToSet[],
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(
    (_url: string, _anonKey: string, options: { cookies: { setAll: (cookiesToSet: CookieToSet[]) => void } }) => ({
    auth: {
      getUser: async () => {
        if (mockCookiesToSet.length > 0) {
          options.cookies.setAll(mockCookiesToSet)
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

import { middleware } from '@/middleware'

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

    const response = await middleware(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBe('https://example.com/admin/login?redirect=%2Fadmin%2Freleases')
    expect(response.cookies.get('sb-access-token')?.value).toBe('fresh-token')
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

    const response = await middleware(createRequest('/admin/releases'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.cookies.get('sb-refresh-token')?.value).toBe('fresh-refresh-token')
  })
})
