import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase server client with cookie-based auth.
 * Safe to use in Server Components where cookies are read-only;
 * setAll errors are silently ignored.
 */
export const createClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.',
      )
    }
    console.warn('⚠️ Supabase not configured — degraded mode for local dev (public site will use fallbacks).')
    // Fluent stub that supports common chaining: .from().select().eq().order().limit().single()/.maybeSingle()
    // Also thenable so `await supabase.from().select()` works for queries without terminal method.
    const makeQueryBuilder = () => {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (onF: any, onR: any) => Promise.resolve({ data: [], error: null }).then(onF, onR),
      }
      return builder
    }
    return {
      from: () => makeQueryBuilder(),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured locally' } }),
      },
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
        headers?: Record<string, string>,
      ) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = { ...options };
            // Local dev shim: Supabase often sets secure:true even on http; browser drops Secure cookies on localhost.
            if (process.env.NODE_ENV !== 'production') {
              finalOptions.secure = false;
            }
            // Pass through (with dev-only secure tweak)
            cookieStore.set(name, value, finalOptions);
          });
          if (headers) {
            // Headers applied by callers
          }
        } catch {
          // setAll called from a Server Component – safe to ignore
        }
      },
    },
  })
}

/**
 * Creates a Supabase server client for use in Server Actions and Layouts,
 * where cookies can be written. Unlike createClient(), setAll errors are NOT
 * silently swallowed so that token refreshes are correctly persisted.
 */
export const createActionClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.',
      )
    }
    console.warn('⚠️ Supabase not configured — degraded mode for local dev (public site will use fallbacks).')
    // Fluent stub that supports common chaining: .from().select().eq().order().limit().single()/.maybeSingle()
    // Also thenable so `await supabase.from().select()` works for queries without terminal method.
    const makeQueryBuilder = () => {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (onF: any, onR: any) => Promise.resolve({ data: [], error: null }).then(onF, onR),
      }
      return builder
    }
    return {
      from: () => makeQueryBuilder(),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured locally' } }),
      },
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
        headers?: Record<string, string>,
      ) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = { ...options };
            // Local dev shim: prevent secure cookies breaking on http://localhost
            if (process.env.NODE_ENV !== 'production') {
              finalOptions.secure = false;
            }
            cookieStore.set(name, value, finalOptions);
          });
          if (headers) {
            // Headers forwarded by route/middleware callers
          }
        } catch (error) {
          // Re-throw for action/layout contexts so token refresh cookies persist (do not swallow)
          throw error
        }
      },
    },
  })
}
