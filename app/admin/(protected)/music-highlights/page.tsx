import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { deleteMusicHighlight } from '@/app/admin/_actions/musicHighlights'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'

export default async function MusicHighlightsPage() {
  let items: Array<{ id: string; title: string; youtube_url: string; display_order: number }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('music_highlights')
      .select('id, title, youtube_url, display_order')
      .order('display_order', { ascending: true })
    items = data ?? []
  } catch {
    // ignore – no data in dev
  }

  return (
    <div>
      <AdminPageHeader
        title="Music Highlights"
        description="Curate featured YouTube videos for the Music Highlights section."
        action={
          <Link
            href="/admin/music-highlights/new"
            className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            + New Highlight
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="text-zinc-400 text-sm">No music highlights yet.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left py-2 pr-4">Order</th>
              <th className="text-left py-2 pr-4">Title</th>
              <th className="text-left py-2 pr-4">YouTube URL</th>
              <th className="text-right py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                <td className="py-2 pr-4 text-zinc-400">{item.display_order}</td>
                <td className="py-2 pr-4 text-zinc-200">{item.title}</td>
                <td className="py-2 pr-4 text-zinc-400 max-w-xs truncate">{item.youtube_url}</td>
                <td className="py-2 text-right space-x-2">
                  <Link
                    href={`/admin/music-highlights/${item.id}`}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    Edit
                  </Link>
                  <form
                    action={async () => {
                      'use server'
                      await deleteMusicHighlight(item.id)
                    }}
                    className="inline"
                  >
                    <button
                      type="submit"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
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
