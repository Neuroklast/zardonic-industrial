import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase browser client.
 */
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
