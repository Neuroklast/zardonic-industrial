'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const redirect = searchParams.get('redirect') ?? '/admin'
    router.push(redirect)
    router.refresh()
  }

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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-zinc-300 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-zinc-300 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
