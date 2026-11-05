import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const baseUrl = new URL('/admin/forgot-password', request.url)
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return new Response(null, { status: 403 })
  }
  const email = String((await request.formData()).get('email') ?? '').trim()
  // Always respond identically for existing and non-existing accounts.
  if (!email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    baseUrl.searchParams.set('sent', '1')
    return NextResponse.redirect(baseUrl, 303)
  }

  try {
    const limited = await consumeRateLimitForRequest(request, {
      namespace: 'password-recovery',
      limit: 5,
      windowSeconds: 3600,
    })
    if (!limited.allowed) {
      baseUrl.searchParams.set('error', 'rate')
      return NextResponse.redirect(baseUrl, 303)
    }
  } catch {
    baseUrl.searchParams.set('error', 'rate')
    return NextResponse.redirect(baseUrl, 303)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    baseUrl.searchParams.set('error', 'config')
    return NextResponse.redirect(baseUrl, 303)
  }
  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL('/admin/reset-password', request.url).toString(),
    })
  } catch {
    // Avoid revealing whether this account exists. Operational errors are logged by Supabase Auth.
  }
  baseUrl.searchParams.set('sent', '1')
  return NextResponse.redirect(baseUrl, 303)
}
