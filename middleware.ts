import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  // Must be `let` — Supabase SSR reassigns this inside setAll when refreshing tokens
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      // @supabase/ssr ≥ 0.12 passes cache-control headers as the second arg.
      // Apply them to the rebuilt response so Vercel Edge / CDNs don't cache
      // token-refresh responses and inadvertently strip Set-Cookie headers.
      setAll: (cookiesToSet, headers) => {
        // Mutate the request cookie store so subsequent getAll() calls see the new values
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        // Rebuild the cookie header from the now-updated request.cookies so the
        // downstream Server Component receives the refreshed tokens in its cookie store.
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set(
          'cookie',
          request.cookies.getAll().map(({ name, value }) => `${name}=${value}`).join('; '),
        )
        response = NextResponse.next({ request: { headers: requestHeaders } })
        // Also write the new cookies onto the response so the browser stores them.
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        // Apply cache-control headers so CDNs don't cache this response.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        )
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Check admin role — if no profile row exists, allow through (authenticated user)
  // Only block if role is explicitly set to something other than 'admin'
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
    const forbiddenRedirect = NextResponse.redirect(new URL('/admin/login?error=forbidden', request.url))
    response.cookies.getAll().forEach((cookie) => {
      forbiddenRedirect.cookies.set(cookie.name, cookie.value)
    })
    return forbiddenRedirect
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
