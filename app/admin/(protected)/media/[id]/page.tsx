import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import EditMediaForm from './EditMediaForm'

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: item } = await supabase
    .from('media_downloads')
    .select(
      'id, title, description, category, file_storage_path, file_url, file_mime, file_size_bytes, original_filename, display_order',
    )
    .eq('id', id)
    .single()

  if (!item) {
    return (
      <div>
        <p className="text-zinc-400">Media file not found.</p>
        <Link href="/admin/media" className="text-sm text-zinc-500 hover:text-white mt-2 inline-block">
          ← Back to Media
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin/media" className="text-zinc-500 hover:text-white text-sm">
        ← Media
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-6">Edit Media File</h1>
      <EditMediaForm item={item} />
    </div>
  )
}
