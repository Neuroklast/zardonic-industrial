import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function handleLogout(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/admin/login', request.url), { status: 302 })
}

/** POST /admin/logout — form-action logout */
export async function POST(request: NextRequest) {
  return handleLogout(request)
}

/**
 * GET /admin/logout — handles Next.js RSC prefetch requests (_rsc=… query param)
 * that arrive when the router navigates to this route client-side.
 * Without this handler Next.js returns 405, causing repeated console errors.
 */
export async function GET(request: NextRequest) {
  return handleLogout(request)
}
