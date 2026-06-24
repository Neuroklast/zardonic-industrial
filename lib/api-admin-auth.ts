import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'

/** Returns true when the current session belongs to an admin profile. */
export async function isAdminSession(): Promise<boolean> {
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

/** Admin user id for job attribution, or null. */
export async function getAdminUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

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
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile as { role?: string } | null)?.role !== 'admin') return null
  return user.id
}