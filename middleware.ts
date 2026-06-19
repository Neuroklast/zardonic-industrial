import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
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

  // Saubere Response
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        // Update request cookies so that Server Components/Actions in the same request
        // see the freshly refreshed tokens.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

        // Recreate the response to reflect the updated request headers downstream.
        response = NextResponse.next({
          request,
        })

        // Apply updated cookies and headers to the response so the browser receives them.
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          )
        }
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
    // Persist refreshed cookies from `response` to `redirectResponse`
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie.name, cookie.value, { ...cookie })
    }
    return redirectResponse
  }

  // Admin-Role Check (tolerant bei fehlendem Profile-Row, wie bisher)
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
    const redirectResponse = NextResponse.redirect(forbiddenUrl)
    // Persist refreshed cookies from `response` to `redirectResponse`
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie.name, cookie.value, { ...cookie })
    }
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
