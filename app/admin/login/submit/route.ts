import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabaseAdmin'

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
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const redirectTo = String(formData.get('redirectTo') || '/admin/releases')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = new URL('/admin/login?error=config', request.url)
    return NextResponse.redirect(url, 303)
  }

  // Note: even if SERVICE_ROLE_KEY is missing, the profile upsert below is wrapped in try/catch
  // so login itself can still succeed (user gets HttpOnly cookies).

  // Prepare the final redirect response FIRST so setAll can attach cookies to it.
  const finalRedirectUrl = redirectTo.startsWith('/') ? redirectTo : '/admin/releases'
  let response = NextResponse.redirect(new URL(finalRedirectUrl, request.url), 303)

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
          // CRITICAL: pass options through unchanged for chunking.
          // Local dev shim: Supabase often marks cookies secure even on http://localhost.
          // Browsers refuse Secure cookies over plain http → session "disappears" immediately after login.
          // We only tweak `secure` in non-prod; other flags (httpOnly, sameSite, path) stay exactly as Supabase gave them.
          const finalOptions = { ...options };
          if (process.env.NODE_ENV !== 'production' || request.url.includes('localhost')) {
            finalOptions.secure = false;
          }
          response.cookies.set(name, value, finalOptions);
        })
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        }
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // On failure, redirect back to login with the real error message.
    // (Do not leak internal details beyond message.)
    const errorUrl = new URL('/admin/login', request.url)
    errorUrl.searchParams.set('msg', error.message || 'Login failed')
    // For error path we can return a fresh redirect (no valid session cookies to propagate).
    return NextResponse.redirect(errorUrl, 303)
  }

  // Success path: ensure this user has an admin profile row.
  // This solves the common "login succeeds but immediately kicked out because no profile / wrong role" locally and on first setup.
  // Uses service role (if SUPABASE_SERVICE_ROLE_KEY is present). Non-fatal if missing.
  try {
    if (data?.user?.id) {
      const adminClient = createAdminClient();
      await adminClient
        .from('profiles')
        .upsert(
          { id: data.user.id, role: 'admin' },
          { onConflict: 'id' }
        );
    }
  } catch (profileErr) {
    // Don't fail the login if profile bootstrap fails (e.g. no service key in local env)
    // User can still manually ensure the profiles row if needed.
    console.warn('[admin login] could not auto-upsert profiles row:', profileErr);
  }

  // Success: response already has the Set-Cookie(s) attached by the setAll callback during signIn.
  // Browser follows the 303 with cookies present.
  return response
}

// Optional: allow GET to be explicit no-op (avoid 405 noise in some prefetch cases)
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/admin/login', request.url), 303)
}
