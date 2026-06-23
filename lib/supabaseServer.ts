import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Shared helper: decide whether to force secure=false.
 * - Always in non-production (npm run dev).
 * - Also on localhost even under `next start` (prod build) because browsers reject Secure cookies over http.
 * Used by all setAll adapters (submit, proxy, createClient*, requireAdmin).
 */
export function shouldForceInsecureCookies(urlStr?: string | null): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  if (!urlStr) return false
  try {
    const host = new URL(urlStr).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

/**
 * Internal factory for a safe @supabase/ssr cookies adapter.
 * Always:
 *  - spreads options first (enables chunked cookies)
 *  - applies only the secure shim
 *  - forwards the headers arg (ssr >= 0.12 no-cache etc.)
 *  - respects the swallow flag for Server Component contexts
 */
function makeCookieAdapter(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  swallow: boolean,
  requestUrl?: string | null,
) {
  return {
    getAll: () => cookieStore.getAll(),
    setAll: (
      cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
      headers?: Record<string, string>,
    ) => {
      const apply = () => {
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = { ...options }
          if (shouldForceInsecureCookies(requestUrl)) {
            finalOptions.secure = false
          }
          cookieStore.set(name, value, finalOptions)
        })
        if (headers) {
          // Headers (Cache-Control private/no-cache etc.) are best-effort here.
          // Primary application happens in submit route and middleware/proxy.
          Object.entries(headers).forEach(([k, v]) => {
            try {
              // In some contexts (pure SC) header mutation is a no-op; ignore.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(cookieStore as any).headers?.set?.(k, v)
            } catch {
              // intentional: headers may not be writable in this context
            }
          })
        }
      }

      if (swallow) {
        try {
          apply()
        } catch {
          // setAll called from a Server Component – safe to ignore per @supabase/ssr guidance
        }
      } else {
        apply()
      }
    },
  }
}

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: makeCookieAdapter(cookieStore, true /* swallow for SC */, null),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: makeCookieAdapter(cookieStore, false /* do not swallow — actions/layouts must persist refreshes */, null),
  })
}
