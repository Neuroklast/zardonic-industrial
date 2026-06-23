import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using the service role key.
 * Bypasses Row Level Security – use only in server actions and scripts.
 */
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Supabase admin access is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.',
      )
    }
    console.warn('⚠️ No SUPABASE_SERVICE_ROLE_KEY — admin client stubbed for local dev.')
    const makeAdminQuery = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = {
        upsert: () => Promise.resolve({ data: null, error: null }),
        select: () => b,
        eq: () => b,
      }
      return b
    }
    return {
      from: () => makeAdminQuery(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
