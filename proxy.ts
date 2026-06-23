import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'

/**
 * Canonical admin auth "proxy" (the active protection file per this Next.js version's convention).
 * Next 16 + Turbopack in this project treats proxy.ts as the auth gate (middleware.ts deprecated).
 * Exports both a default function and named `proxy` (for tests) + `config`.
 *
 * See AGENTS.md for cookie rules this implements.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow login/logout (and non-admin). Login form must reach the submit handler.
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/logout')
  ) {
    return NextResponse.next()
  }

  // Protect only /admin/*
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url))
  }

  // === CANONICAL @supabase/ssr PATTERN (per AGENTS.md) ===
  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        // Recreate response so that setAll can mutate cookies safely
        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        })

        // Pass Supabase options THROUGH UNCHANGED (enables chunked cookies, no silent drop)
        // Use canonical shared helper for secure flag.
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = { ...options }
          if (shouldForceInsecureCookies(request.url)) {
            finalOptions.secure = false
          }
          supabaseResponse.cookies.set(name, value, finalOptions)
        })

        // Forward ssr>=0.12 headers (Cache-Control: private, no-cache..., Expires, Pragma)
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        }
      },
    },
  })

  // IMPORTANT: call getUser() immediately after createServerClient (refreshes tokens + triggers setAll)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Helper: always copy refreshed cookies + headers from supabaseResponse onto redirect responses.
  // Per AGENTS.md: "Every NextResponse.redirect() returned from proxy.ts must copy..."
  // Use explicit 303 (See Other) to force GET after auth decisions, matching the login submit handler.
  function redirectWithCookies(targetUrl: URL) {
    const redirectResponse = NextResponse.redirect(targetUrl, 303)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      // Clean copy: do not pass the raw cookie descriptor (it contains name/value) as options.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { name, value, ...opts } = cookie as any
      redirectResponse.cookies.set(name, value, opts)
    })
    // Also propagate any Cache-Control/no-cache headers from ssr
    supabaseResponse.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  if (authError || !user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return redirectWithCookies(loginUrl)
  }

  // Admin-Role Check (tolerant if no profiles row yet — submit handler does best-effort upsert)
  let profile: { role?: string } | null = null
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    profile = data ?? null
  } catch {
    profile = null
  }

  if (profile !== null && profile.role !== 'admin') {
    const forbiddenUrl = new URL('/admin/login?error=forbidden', request.url)
    return redirectWithCookies(forbiddenUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}

// Default export for the runtime "proxy" / middleware loader (and named via declaration)
export default proxy
