import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow /admin/login and /admin/logout through (not protected)
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login') || pathname.startsWith('/admin/logout')) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url))
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })
  // Supabase may refresh tokens during auth.getUser() and call setAll().
  // We keep the latest cookies here so refreshes survive any redirect response.
  const refreshedCookies = new Map<string, { value: string; options?: CookieOptions }>()

  const withRefreshedCookies = (redirectResponse: NextResponse) => {
    refreshedCookies.forEach(({ value, options }, name) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        response = NextResponse.next({
          request: { headers: request.headers },
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
          refreshedCookies.set(name, { value, options })
        })
      },
    },
  })

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

    if (profile && profile.role !== 'admin') {
      return withRefreshedCookies(NextResponse.redirect(new URL('/admin/login?error=forbidden', request.url)))
    }
  } catch {
    return withRefreshedCookies(NextResponse.redirect(new URL('/admin/login', request.url)))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
