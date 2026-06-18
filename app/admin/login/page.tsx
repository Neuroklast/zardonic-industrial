'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const emailValue = formData.get('email')
    const passwordValue = formData.get('password')

    if (
      typeof emailValue !== 'string' ||
      emailValue.trim() === '' ||
      typeof passwordValue !== 'string' ||
      passwordValue === ''
    ) {
      setError('Email and password are required.')
      setPending(false)
      return
    }

    const email = emailValue.trim()
    const password = passwordValue
    const redirectTo = searchParams.get('redirect') ?? '/admin'
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setPending(false)
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-zinc-300 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-base focus:outline-none focus:border-zinc-500"
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
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-base focus:outline-none focus:border-zinc-500"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign In'}
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
