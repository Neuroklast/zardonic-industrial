import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Login und Logout immer durchlassen
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/logout')
  ) {
    return NextResponse.next()
  }

  // Nur /admin/* schützen
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
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = { ...options };
          // Local dev shim: prevent "secure" cookies on http://localhost (common cause of immediate logout after login)
          if (process.env.NODE_ENV !== 'production' || request.url.includes('localhost')) {
            finalOptions.secure = false;
          }
          supabaseResponse.cookies.set(name, value, finalOptions);
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

  // WICHTIG: getUser() direkt nach createServerClient aufrufen (refreshes tokens)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Helper: always copy refreshed cookies + headers from supabaseResponse onto redirect responses
  function redirectWithCookies(targetUrl: URL) {
    const redirectResponse = NextResponse.redirect(targetUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    // Also propagate any Cache-Control/no-cache headers
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

  // Admin-Role Check (tolerant bei fehlendem Profile-Row)
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
