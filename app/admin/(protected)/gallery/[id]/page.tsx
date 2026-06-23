import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import EditGalleryForm from './EditGalleryForm'

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: item } = await supabase
    .from('gallery')
    .select('id, alt, caption, storage_path, image_url, display_order')
    .eq('id', id)
    .single()

  if (!item) {
    return (
      <div>
        <p className="text-zinc-400">Gallery image not found.</p>
        <Link href="/admin/gallery" className="text-sm text-zinc-500 hover:text-white mt-2 inline-block">
          ← Back to Gallery
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin/gallery" className="text-zinc-500 hover:text-white text-sm">
        ← Gallery
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-6">Edit Gallery Image</h1>
      <EditGalleryForm item={item} />
    </div>
  )
}