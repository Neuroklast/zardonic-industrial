'use client'

import { useSearchParams } from 'next/navigation'

/**
 * Login form that POSTs natively to /admin/login/submit (a server Route Handler).
 *
 * Using a native form POST instead of the browser Supabase client means the server
 * writes the session cookies onto the same 303 redirect response — so the browser
 * has the auth cookies before it ever requests the protected route.  This eliminates
 * the cookie-propagation race that caused the redirect loop when using router.push()
 * after a client-side signInWithPassword() call.
 */
export default function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const msgParam = searchParams.get('msg')
  const redirectTo = searchParams.get('redirect') ?? '/admin'

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-zinc-400 text-sm mt-1">Zardonic CMS</p>
        </div>

        {errorParam === 'forbidden' && (
          <div className="mb-4 p-3 rounded bg-red-950 border border-red-800 text-red-300 text-sm">
            Access denied. Your account does not have admin privileges.
          </div>
        )}
        {errorParam === 'config' && (
          <div className="mb-4 p-3 rounded bg-red-950 border border-red-800 text-red-300 text-sm">
            Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </div>
        )}
        {msgParam && errorParam !== 'forbidden' && errorParam !== 'config' && (
          <div className="mb-4 p-3 rounded bg-red-950 border border-red-800 text-red-300 text-sm">
            {msgParam}
          </div>
        )}

        <form method="POST" action="/admin/login/submit" className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <label htmlFor="email" className="block text-sm text-zinc-300 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-zinc-300 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
