import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { deleteGig } from '@/app/admin/_actions/gigs'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { GigsSyncButton } from './GigsSyncButton'

export default async function GigsPage() {
  let gigs: Array<{ id: string; title: string; city: string | null; event_date: string }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('gigs')
      .select('id, title, city, event_date')
      .order('event_date', { ascending: false })
    gigs = data ?? []
  } catch {
    // ignore
  }

  return (
    <div>
      <AdminPageHeader
        title="Gigs"
        description="Manage upcoming and past events shown in the Events section."
        action={
          <Link href="/admin/gigs/new" className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors">
            + New Gig
          </Link>
        }
      />
      <div className="mb-6">
        <GigsSyncButton />
      </div>
      {gigs.length === 0 ? (
        <p className="text-zinc-400 text-sm">No gigs yet.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left py-2 pr-4">Title</th>
              <th className="text-left py-2 pr-4">City</th>
              <th className="text-left py-2 pr-4">Date</th>
              <th className="text-right py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gigs.map((gig) => (
              <tr key={gig.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                <td className="py-2 pr-4 text-zinc-200">{gig.title}</td>
                <td className="py-2 pr-4 text-zinc-400">{gig.city ?? '—'}</td>
                <td className="py-2 pr-4 text-zinc-400">{new Date(gig.event_date).toLocaleDateString()}</td>
                <td className="py-2 text-right space-x-2">
                  <Link href={`/admin/gigs/${gig.id}`} className="text-zinc-400 hover:text-white transition-colors">Edit</Link>
                  <form action={async () => { 'use server'; await deleteGig(gig.id) }} className="inline">
                    <button type="submit" className="text-red-400 hover:text-red-300 transition-colors">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
