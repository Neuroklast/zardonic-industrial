'use server'

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string | null) ?? '/admin/releases'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url), 303)
  }

  // WICHTIG: Response erst NACH erfolgreichem Login erstellen
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        // Wir erstellen die Response erst später → hier nur sammeln
        // (Supabase schreibt die Cookies später selbst drauf)
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('msg', error?.message || 'Login fehlgeschlagen')
    loginUrl.searchParams.set('redirect', redirectTo)
    return NextResponse.redirect(loginUrl, 303)
  }

  // Jetzt erst die Redirect-Response erstellen
  const response = NextResponse.redirect(
    new URL(redirectTo, request.url),
    303
  )

  // Session manuell als einziges Cookie setzen (vermeidet Chunking-Probleme)
  const sessionValue = `base64-${btoa(JSON.stringify(data.session))}`

  response.cookies.set({
    name: 'sb-jksluzrcxqjtfwcrbxiw-auth-token',
    value: sessionValue,
    path: '/',
    maxAge: 60 * 60 * 24 * 400,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // false, weil du teilweise client-seitig liest
  })

  return response
}
