import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import { deleteGalleryImage } from '@/app/admin/_actions/gallery'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { GalleryVisibilityToggle } from './GalleryVisibilityToggle'
import Image from 'next/image'
import Link from 'next/link'

export default async function GalleryPage() {
  let images: Array<{
    id: string
    alt: string | null
    storage_path: string | null
    image_url: string | null
    display_order: number
    active: boolean
  }> = []

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
        description="Manage public gallery images. Upload, link, or import from Google Drive — all cached to R2."
        action={
          <Link href="/admin/gallery/new" className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors">
            + Upload Image
          </Link>
        }
      />
      {images.length === 0 ? (
        <p className="text-zinc-400 text-sm">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => {
            const src = resolveImageUrl(img.storage_path, img.image_url)
            return (
              <div key={img.id} className="bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
                <div className="relative aspect-square bg-zinc-800">
                  {src ? (
                    <Image
                      src={src}
                      alt={img.alt ?? ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                      NO IMAGE
                    </div>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400 truncate">{img.alt ?? 'No alt'}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <GalleryVisibilityToggle imageId={img.id} active={img.active ?? true} />
                    <Link href={`/admin/gallery/${img.id}`} className="text-xs text-zinc-400 hover:text-white transition-colors">
                      Edit
                    </Link>
                    <form action={async () => { 'use server'; await deleteGalleryImage(img.id) }}>
                      <button type="submit" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
