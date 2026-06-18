import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow /admin/login and /admin/logout through (not protected)
  if (
    !pathname.startsWith('/admin') ||
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/logout')
  ) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url))
  }

  // We build ONE mutable response object. Supabase's setAll may be called
  // during auth.getUser() to refresh tokens — all cookie writes go here.
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        // Write refreshed cookies into the request (for downstream reads)
        // and into the response (so the browser receives them).
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Helper: copy any already-set cookies from `response` onto a redirect.
  const withRefreshedCookies = (redirectResponse: NextResponse): NextResponse => {
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return withRefreshedCookies(NextResponse.redirect(loginUrl))
    }

    // Check admin role in profiles table.
    // If the row is missing (null), we allow through — the user is authenticated
    // and may not have a profile row yet. Only block if role is explicitly NOT 'admin'.
    let profile: { role?: string } | null = null
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      profile = (data as { role?: string } | null) ?? null
    } catch {
      profile = null
    }

    if (profile !== null && profile.role !== 'admin') {
      return withRefreshedCookies(
        NextResponse.redirect(new URL('/admin/login?error=forbidden', request.url)),
      )
    }
  } catch {
    return withRefreshedCookies(NextResponse.redirect(new URL('/admin/login', request.url)))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
