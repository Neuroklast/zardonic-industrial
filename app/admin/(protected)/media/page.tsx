import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import Link from 'next/link'
import { MediaSortable, type MediaListRow } from './MediaSortable'

export default async function MediaDownloadsPage() {
  let items: MediaListRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('media_downloads')
      .select(
        'id, title, category, file_storage_path, file_url, file_mime, file_size_bytes, original_filename, display_order, active',
      )
      .order('display_order', { ascending: true })
    items = data ?? []
  } catch {
    // ignore
  }

  return (
    <div>
      <AdminPageHeader
        title="Media Downloads"
        description="Press photos, logos, PDFs, ZIPs and audio for public download. Drag rows to reorder. Originals stored in R2 (not WebP-converted)."
        action={
          <Link
            href="/admin/media/new"
            className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            + Upload File
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="text-zinc-400 text-sm">No downloadable files yet.</p>
      ) : (
        <MediaSortable initialItems={items} />
      )}
    </div>
  )
}
