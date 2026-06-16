'use client'

import { useRouter } from 'next/navigation'
import { updateGig } from '@/app/admin/_actions/gigs'
import { useState } from 'react'

interface Props { gig: Record<string, unknown> }

export default function EditGigForm({ gig }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await updateGig(gig.id as string, formData)
    if (result?.error) setError(result.error)
    else router.push('/admin/gigs')
  }

  const eventDate = gig.event_date
    ? new Date(gig.event_date as string).toISOString().slice(0, 16)
    : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Title *</label>
        <input name="title" required defaultValue={gig.title as string} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Venue</label>
          <input name="venue" defaultValue={gig.venue as string ?? ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Festival Name</label>
          <input name="festival_name" defaultValue={gig.festival_name as string ?? ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">City</label>
          <input name="city" defaultValue={gig.city as string ?? ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Country</label>
          <input name="country" defaultValue={gig.country as string ?? ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Date & Time *</label>
        <input name="event_date" type="datetime-local" required defaultValue={eventDate} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Ticket URL</label>
        <input name="ticket_url" type="url" defaultValue={gig.ticket_url as string ?? ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">Save Changes</button>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:text-white transition-colors">Cancel</button>
      </div>
    </form>
  )
}
