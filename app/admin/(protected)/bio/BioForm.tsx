'use client'

import { useState } from 'react'
import { updateBio } from '@/app/admin/_actions/bio'

export default function BioForm({ initialContent }: { initialContent: string }) {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await updateBio(formData)
    if (result?.error) setError(result.error)
    else setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Bio Text</label>
        <textarea
          name="content"
          defaultValue={initialContent}
          rows={10}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none resize-none"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && <p className="text-green-400 text-sm">Saved!</p>}
      <button type="submit" className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">
        Save Bio
      </button>
    </form>
  )
}
