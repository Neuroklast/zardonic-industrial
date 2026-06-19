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

  // === SAUBERES PATTERN (offiziell empfohlen) ===
  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
        })

        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        }
      },
    },
  })

  // WICHTIG: getUser() direkt nach createServerClient aufrufen
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl) // Supabase cookies werden automatisch mitgenommen
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
    return NextResponse.redirect(forbiddenUrl) // Supabase cookies werden automatisch mitgenommen
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
