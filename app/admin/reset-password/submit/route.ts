import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 })

  const invalid = new URL('/admin/reset-password', request.url)
  const form = await request.formData()
  const password = form.get('password')
  const confirm = form.get('confirm')
  if (typeof password !== 'string' || typeof confirm !== 'string'
      || password.length < 12 || password.length > 128 || password !== confirm) {
    invalid.searchParams.set('error', 'password')
    return NextResponse.redirect(invalid, 303)
  }

  try {
    const rateLimit = await consumeRateLimitForRequest(request, {
      namespace: 'password-reset-update',
      limit: 10,
      windowSeconds: 3600,
    })
    if (!rateLimit.allowed) {
      invalid.searchParams.set('error', 'rate')
      return NextResponse.redirect(invalid, 303)
    }
  } catch {
    invalid.searchParams.set('error', 'rate')
    return NextResponse.redirect(invalid, 303)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    invalid.searchParams.set('error', 'config')
    return NextResponse.redirect(invalid, 303)
  }
  const response = NextResponse.redirect(new URL('/admin/login?notice=password-updated', request.url), 303)
  const cookieStore = await cookies()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
        headers?: Record<string, string>,
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = { ...options }
          if (shouldForceInsecureCookies(request.url)) finalOptions.secure = false
          response.cookies.set(name, value, finalOptions)
        })
        if (headers) {
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
        }
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    invalid.searchParams.set('error', 'session')
    return NextResponse.redirect(invalid, 303)
  }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    invalid.searchParams.set('error', 'update')
    return NextResponse.redirect(invalid, 303)
  }
  // End the recovery session, so the next step is a normal password sign-in.
  await supabase.auth.signOut()
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
