'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorParam = searchParams.get('error')
  const msgParam = searchParams.get('msg')
  const redirectTo = searchParams.get('redirect') ?? '/admin/releases'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(msgParam)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setIsLoading(false)
      return
    }

    router.push(redirectTo)
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
        {errorParam === 'config' && (
          <div className="mb-4 p-3 rounded bg-red-950 border border-red-800 text-red-300 text-sm">
            Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </div>
        )}
        {errorMsg && errorParam !== 'forbidden' && errorParam !== 'config' && (
          <div className="mb-4 p-3 rounded bg-red-950 border border-red-800 text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-zinc-300 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-base focus:outline-none focus:border-zinc-500"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
