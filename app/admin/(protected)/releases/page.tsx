import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { ReleasesListClient } from './ReleasesListClient'

export default async function ReleasesPage() {
  let releases: Array<{
    id: string
    title: string
    type: string
    release_date: string | null
    active: boolean
    display_order: number
  }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('releases')
      .select('id, title, type, release_date, active, display_order')
      .order('display_order', { ascending: true })
    releases = (data ?? []).map(
      (row: {
        id: string
        title: string
        type: string
        release_date: string | null
        active: boolean
        display_order: number | null
      }) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        release_date: row.release_date,
        active: row.active,
        display_order: typeof row.display_order === 'number' ? row.display_order : 0,
      }),
    )
  } catch {
    // ignore
  }

  return (
    <div>
      <AdminPageHeader
        title="Discography"
        description="Manage releases, cover art (R2), and streaming links."
        action={
          <>
          <Link
            href="/admin/releases/sync"
            className="px-3 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            Catalogue Sync
          </Link>
          <Link
            href="/admin/releases/new"
            className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            + New Release
          </Link>
          </>
        }
      />

      <ReleasesListClient releases={releases} />
    </div>
  )
}
