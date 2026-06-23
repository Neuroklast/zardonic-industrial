'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const searchParams = useSearchParams()

  const errorParam = searchParams.get('error')
  const msgParam = searchParams.get('msg')
  const redirectTo = searchParams.get('redirect') ?? '/admin/releases'

  const [isLoading, setIsLoading] = useState(false)

  // Server-provided generic auth error message from the /submit handler
  const serverAuthError = msgParam && errorParam !== 'forbidden' && errorParam !== 'config' ? msgParam : null

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
        {serverAuthError && (
          <div className="mb-4 p-3 rounded bg-red-950 border border-red-800 text-red-300 text-sm">
            {serverAuthError}
          </div>
        )}

        {/* NATIVE FORM — canonical path per AGENTS.md.
           POST goes to server Route Handler which performs signInWithPassword via createServerClient
           and attaches HttpOnly cookies to the 303 redirect response. */}
        <form
          method="POST"
          action="/admin/login/submit"
          className="space-y-4"
          onSubmit={() => setIsLoading(true)}
        >
          {/* Forward the intended destination so submit can 303 to it after success */}
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <label htmlFor="email" className="block text-sm text-zinc-300 mb-1">Email (or phone)</label>
            <input
              id="email"
              name="email"
              type="text"
              inputMode="email"
              required
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-base focus:outline-none focus:border-zinc-500"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-zinc-300 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-base focus:outline-none focus:border-zinc-500"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
