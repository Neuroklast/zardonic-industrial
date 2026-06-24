'use client'

import { useRouter } from 'next/navigation'
import { createGig } from '@/app/admin/_actions/gigs'
import { useState } from 'react'

export default function NewGigPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createGig(formData)
    if (result?.error) setError(result.error)
    else router.push('/admin/gigs')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">New Gig</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Title *</label>
          <input name="title" required className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Venue</label>
            <input name="venue" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Festival Name</label>
            <input name="festival_name" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">City</label>
            <input name="city" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Country</label>
            <input name="country" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Date & Time *</label>
          <input name="event_date" type="datetime-local" required className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Ticket URL</label>
          <input name="ticket_url" type="url" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">Create Gig</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:text-white transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}
