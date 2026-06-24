'use client'

import { useState } from 'react'
import { createSocialLink } from '@/app/admin/_actions/social'
import { useRouter } from 'next/navigation'

export default function SocialForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createSocialLink(formData)
    if (result?.error) setError(result.error)
    else {
      ;(e.target as HTMLFormElement).reset()
      setError(null)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Platform *</label>
          <input name="platform" required placeholder="Spotify" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">URL *</label>
          <input name="url" type="url" required className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">Add Link</button>
    </form>
  )
}
