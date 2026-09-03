'use client'

import { useState } from 'react'
import { changeAdminPassword } from '@/app/admin/_actions/changePassword'

const inputClass =
  'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600'

export function ChangePasswordForm() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const result = await changeAdminPassword(formData)

    if ('error' in result && result.error) {
      setStatus('error')
      setMessage(result.error)
      return
    }

    setStatus('saved')
    setMessage('Password changed successfully.')
    event.currentTarget.reset()
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="current" className="block text-sm font-medium text-zinc-300 mb-1">
          Current password
        </label>
        <input
          id="current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="next" className="block text-sm font-medium text-zinc-300 mb-1">
          New password
        </label>
        <input
          id="next"
          name="next"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">At least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300 mb-1">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'saving' ? 'Changing…' : 'Change password'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-400">{message}</span>}
        {status === 'error' && message && <span className="text-sm text-red-400">{message}</span>}
      </div>
    </form>
  )
}
