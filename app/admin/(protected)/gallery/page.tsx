import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import Link from 'next/link'
import { GallerySortable, type GalleryListRow } from './GallerySortable'

export default async function GalleryPage() {
  let images: GalleryListRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('gallery')
      .select('id, alt, storage_path, image_url, display_order, active')
      .order('display_order', { ascending: true })
    images = data ?? []
  } catch {
    // ignore
  }

  return (
    <div>
      <AdminPageHeader
        title="Gallery"
        description="Manage public gallery images. Drag tiles to reorder. Upload, link, or import from Google Drive — all cached to R2."
        action={
          <Link href="/admin/gallery/new" className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors">
            + Upload Image
          </Link>
        }
      />
      {images.length === 0 ? (
        <p className="text-zinc-400 text-sm">No images yet.</p>
      ) : (
        <GallerySortable initialImages={images} />
      )}
    </div>
  )
}
