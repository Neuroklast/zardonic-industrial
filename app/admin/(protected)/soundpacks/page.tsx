import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { SoundpacksSortable, type SoundpackListRow } from './SoundpacksSortable'

export default async function SoundpacksPage() {
  let items: SoundpackListRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('soundpacks')
      .select('id, title, display_order')
      .order('display_order', { ascending: true })
    items = data ?? []
  } catch {
    // ignore
  }

  return (
    <div>
      <AdminPageHeader
        title="Soundpacks"
        description="Manage downloadable soundpack listings. Drag rows to reorder. Cover art and external purchase links."
        action={
          <Link
            href="/admin/soundpacks/new"
            className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            + New Item
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="text-zinc-400 text-sm">No soundpacks yet.</p>
      ) : (
        <SoundpacksSortable initialItems={items} />
      )}
    </div>
  )
}
