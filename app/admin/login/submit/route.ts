'use server'

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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

  // Build a mutable response so Supabase can write cookies onto it
  const response = NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            ...options,
          }),
        )
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('msg', error.message)
    loginUrl.searchParams.set('redirect', redirectTo)
    return NextResponse.redirect(loginUrl, { status: 303 })
  }

  return response
}
