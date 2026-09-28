import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { MerchandiseSortable, type MerchandiseListRow } from './MerchandiseSortable'

export default async function MerchandisePage() {
  let items: MerchandiseListRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('merchandise')
      .select('id, title, display_order')
      .order('display_order', { ascending: true })
    items = data ?? []
  } catch {
    // ignore
  }

  return (
    <div>
      <AdminPageHeader
        title="Merchandise"
        description="Manage shop items shown on the public site. Drag rows to reorder. Upload product images via R2 or link external URLs."
        action={
          <Link
            href="/admin/merchandise/new"
            className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            + New Item
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="text-zinc-400 text-sm">No merchandise items yet.</p>
      ) : (
        <MerchandiseSortable initialItems={items} />
      )}
    </div>
  )
}
