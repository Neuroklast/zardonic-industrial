'use server'

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string | null) ?? '/admin'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url))
  }

  // Build a mutable response so Supabase can write cookies onto it.
  // Pass Supabase-provided options through unchanged so @supabase/ssr can emit
  // multiple chunked Set-Cookie headers (sb-…-auth-token.0, .1, …) for large
  // tokens. Overriding options here (e.g. hardcoding httpOnly/secure) bypasses
  // chunking and produces a single oversized cookie that browsers silently drop.
  const response = NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      // @supabase/ssr ≥ 0.12 passes cache-control headers as the second arg so
      // CDNs / Vercel Edge don't cache auth responses and strip Set-Cookie.
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          )
        }
      },
    },
  })

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('msg', error.message)
      loginUrl.searchParams.set('redirect', redirectTo)
      return NextResponse.redirect(loginUrl, { status: 303 })
    }
  } catch (error: any) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('msg', error?.message || 'Login failed')
    loginUrl.searchParams.set('redirect', redirectTo)
    return NextResponse.redirect(loginUrl, { status: 303 })
  }

  return response
}
