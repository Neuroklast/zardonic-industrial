import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { MusicHighlightsSortable, type MusicHighlightListRow } from './MusicHighlightsSortable'

export default async function MusicHighlightsPage() {
  let items: MusicHighlightListRow[] = []

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
        description="Curate featured YouTube videos. Drag rows to reorder the Music Highlights section."
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
        <MusicHighlightsSortable initialItems={items} />
      )}
    </div>
  )
}
