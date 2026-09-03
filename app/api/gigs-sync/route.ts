import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getApiSecret } from '@/lib/api-secrets'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'
import {
  resolveBandsintownArtistName,
  syncBandsintownGigsToSupabase,
} from '@/lib/bandsintown-sync'

export const dynamic = 'force-dynamic'

async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return false

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = { ...options }
          if (shouldForceInsecureCookies(null)) finalOptions.secure = false
          cookieStore.set(name, value, finalOptions)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return (profile as { role?: string } | null)?.role === 'admin'
}

export async function POST(_request: Request) {
  const admin = await isAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = await getApiSecret('bandsintown_api_key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Bandsintown API key not configured' }, { status: 503 })
  }

  try {
    const supabase = createAdminClient()
    const artistName = await resolveBandsintownArtistName(supabase)
    const result = await syncBandsintownGigsToSupabase(supabase, artistName, apiKey)

    return NextResponse.json({ success: true, ...result }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[gigs-sync] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to sync gigs' }, { status: 500 })
  }
}