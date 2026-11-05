import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin
  const origin = request.headers.get('origin')
  if (origin && origin !== requestOrigin) return new Response(null, { status: 403 })

  const failure = new URL('/admin/forgot-password?error=expired', request.url)
  const form = await request.formData()
  const tokenHash = form.get('token_hash')
  if (typeof tokenHash !== 'string' || !tokenHash || tokenHash.length > 2048) {
    return NextResponse.redirect(failure, 303)
  }

  try {
    const rateLimit = await consumeRateLimitForRequest(request, {
      namespace: 'password-recovery-verify',
      limit: 10,
      windowSeconds: 3600,
    })
    if (!rateLimit.allowed) return NextResponse.redirect(failure, 303)
  } catch {
    return NextResponse.redirect(failure, 303)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return NextResponse.redirect(failure, 303)

  // Use the same response to hold verified session cookies and perform the
  // redirect. A fresh redirect response would silently discard the session.
  const response = NextResponse.redirect(new URL('/admin/reset-password', request.url), 303)
  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, anonKey, {
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
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        }
      },
    },
  })
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
  if (error) return NextResponse.redirect(failure, 303)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
