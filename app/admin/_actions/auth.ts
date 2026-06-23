'use server'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
        // Pass options unchanged (canonical pattern)
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
        if (headers) {
          // Headers (no-cache etc.) applied at response level by callers
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
