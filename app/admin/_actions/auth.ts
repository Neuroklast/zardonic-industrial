'use server'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'

/**
 * Verifies that the current request is authenticated as an admin.
 * Throws an error if the user is not authenticated or lacks the admin role.
 * Use at the top of every sensitive server action.
 */
export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
        headers?: Record<string, string>,
      ) => {
        // Canonical: spread first, apply secure shim via shared helper, forward headers.
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = { ...options }
          if (shouldForceInsecureCookies(null)) {
            finalOptions.secure = false
          }
          cookieStore.set(name, value, finalOptions)
        })
        if (headers) {
          // Headers are normally applied by the outer response (mw / route). Keep for completeness.
          Object.entries(headers).forEach(([k, v]) => {
            try {
              // Best effort; server actions have limited header mutation surface.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(cookieStore as any).headers?.set?.(k, v)
            } catch {
              // intentional: header mutation surface limited in server action context
            }
          })
        }
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Your admin session has expired. Please sign in again.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || (profile as { role?: string }).role !== 'admin') {
    throw new Error('Your account does not have admin access.')
  }
}

export async function formatAdminActionError(
  error: unknown,
  fallback = 'The admin request could not be completed.',
): Promise<string> {
  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallback
}

export async function runAdminAction<T extends object>(
  action: () => Promise<T>,
  fallback?: string,
): Promise<T | { error: string }> {
  try {
    await requireAdmin()
    return await action()
  } catch (error) {
    return { error: await formatAdminActionError(error, fallback) }
  }
}
