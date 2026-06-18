import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { DeleteReleaseButton } from './DeleteReleaseButton'

export default async function ReleasesPage() {
  let releases: Array<{ id: string; title: string; type: string; release_date: string | null }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('releases')
      .select('id, title, type, release_date')
      .order('display_order', { ascending: true })
    releases = data ?? []
  } catch {
    // ignore
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Releases</h1>
        <Link
          href="/admin/releases/new"
          className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
        >
          + New Release
        </Link>
      </div>

      {releases.length === 0 ? (
        <p className="text-zinc-400 text-sm">No releases yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left py-2 pr-4">Title</th>
              <th className="text-left py-2 pr-4">Type</th>
              <th className="text-left py-2 pr-4">Date</th>
              <th className="text-right py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => (
              <tr key={release.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                <td className="py-2 pr-4 text-zinc-200">{release.title}</td>
                <td className="py-2 pr-4 text-zinc-400">{release.type}</td>
                <td className="py-2 pr-4 text-zinc-400">{release.release_date ?? '—'}</td>
                <td className="py-2 text-right space-x-2">
                  <Link
                    href={`/admin/releases/${release.id}`}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteReleaseButton releaseId={release.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
