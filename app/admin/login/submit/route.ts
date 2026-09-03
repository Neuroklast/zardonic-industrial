import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'

/**
 * Canonical admin login POST handler.
 * - Native HTML form submits here (method=POST, action="/admin/login/submit").
 * - Uses createServerClient so Supabase writes HttpOnly session cookies
 *   on the SAME 303 redirect response the browser follows.
 * - This guarantees cookies are present before middleware or protected layout run.
 * - setAll passes options UNCHANGED and forwards the headers arg (ssr>=0.12).
 */
export async function POST(request: Request) {
  const formData = await request.formData()
  const rawIdentifier = String(formData.get('email') || formData.get('phone') || '').trim()
  const password = String(formData.get('password') || '')
  const redirectTo = String(formData.get('redirectTo') || '/admin/releases')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = new URL('/admin/login?error=config', request.url)
    return NextResponse.redirect(url, 303)
  }

  // Brute-force throttle per client IP (fail-closed). Avoids unbounded
  // credential-guessing against Supabase Auth.
  try {
    const rl = await consumeRateLimitForRequest(request, {
      namespace: 'login',
      limit: 10,
      windowSeconds: 10 * 60,
    })
    if (!rl.allowed) {
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('msg', 'Too many attempts. Please try again in a few minutes.')
      if (redirectTo && redirectTo !== '/admin/releases') {
        url.searchParams.set('redirect', redirectTo)
      }
      return NextResponse.redirect(url, 303)
    }
  } catch (err) {
    // Fail closed: if the limiter cannot be consulted, refuse the login attempt.
    console.error('[admin login] rate limit error:', err)
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('msg', 'Login temporarily unavailable. Please try again shortly.')
    return NextResponse.redirect(url, 303)
  }

  // Early validation — prevents confusing Supabase "missing email or phone" errors.
  // Always forward redirect param so user does not lose intended destination after fixing the form values.
  if (!rawIdentifier) {
    const errorUrl = new URL('/admin/login', request.url)
    errorUrl.searchParams.set('msg', 'Email (or phone) is required.')
    if (redirectTo && redirectTo !== '/admin/releases') {
      errorUrl.searchParams.set('redirect', redirectTo)
    }
    return NextResponse.redirect(errorUrl, 303)
  }
  if (!password) {
    const errorUrl = new URL('/admin/login', request.url)
    errorUrl.searchParams.set('msg', 'Password is required.')
    if (redirectTo && redirectTo !== '/admin/releases') {
      errorUrl.searchParams.set('redirect', redirectTo)
    }
    return NextResponse.redirect(errorUrl, 303)
  }

  // Build sign-in payload — supports pure email login (phone is not required)
  // and also allows phone login if a non-email identifier is provided.
  const signInPayload = rawIdentifier.includes('@')
    ? { email: rawIdentifier, password }
    : { phone: rawIdentifier, password }

  // Prepare the final redirect response FIRST so setAll can attach cookies to it.
  const finalRedirectUrl = redirectTo.startsWith('/') ? redirectTo : '/admin/releases'
  const response = NextResponse.redirect(new URL(finalRedirectUrl, request.url), 303)

  // Register the attempt with Supabase (writes cookies on success). We create the
  // client directly so cookies are attached to the SAME 303 response the browser
  // follows — the canonical flow per AGENTS.md.
  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
        headers?: Record<string, string>,
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // CRITICAL: pass options through unchanged for chunking (per AGENTS.md).
          // Use shared helper so localhost detection is consistent with middleware + lib.
          const finalOptions = { ...options }
          if (shouldForceInsecureCookies(request.url)) {
            finalOptions.secure = false
          }
          response.cookies.set(name, value, finalOptions)
        })
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        }
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword(signInPayload)

  if (error) {
    // Small constant-time-ish delay to slow credential stuffing / brute force.
    await new Promise((resolve) => setTimeout(resolve, 450))

    // On failure, redirect back to login with the real error message.
    // Improve common confusing Supabase messages.
    let friendlyMessage = error.message || 'Login failed'

    if (/email or phone/i.test(friendlyMessage) || /provide either an email/i.test(friendlyMessage)) {
      friendlyMessage = 'Please enter a valid email address.'
    }

    const errorUrl = new URL('/admin/login', request.url)
    errorUrl.searchParams.set('msg', friendlyMessage)
    if (redirectTo && redirectTo !== '/admin/releases') {
      errorUrl.searchParams.set('redirect', redirectTo)
    }
    // For error path we can return a fresh redirect (no valid session cookies to propagate).
    return NextResponse.redirect(errorUrl, 303)
  }

  // Success: response already has the Set-Cookie(s) attached by the setAll callback during signIn.
  // Browser follows the 303 with cookies present.
  return response
}

// Optional: allow GET to be explicit no-op (avoid 405 noise in some prefetch cases)
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/admin/login', request.url), 303)
}
