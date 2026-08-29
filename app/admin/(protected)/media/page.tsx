import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import { deleteMediaDownload } from '@/app/admin/_actions/mediaDownloads'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { MediaVisibilityToggle } from './MediaVisibilityToggle'
import Link from 'next/link'
import { formatFileSize, mediaKindFromMime, parseMediaCategory } from '@/lib/media-download'
import { toDirectImageUrl } from '@/lib/image-cache'

export default async function MediaDownloadsPage() {
  let items: Array<{
    id: string
    title: string
    category: string | null
    file_storage_path: string | null
    file_url: string | null
    file_mime: string | null
    file_size_bytes: number | null
    original_filename: string | null
    display_order: number
    active: boolean
  }> = []

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
        description="Press photos, logos, PDFs, ZIPs and audio for public download. Originals stored in R2 (not WebP-converted)."
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left py-2 pr-4">Preview</th>
                <th className="text-left py-2 pr-4">Title</th>
                <th className="text-left py-2 pr-4">Category</th>
                <th className="text-left py-2 pr-4">Size</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const src = resolveImageUrl(item.file_storage_path, item.file_url)
                const kind = mediaKindFromMime(item.file_mime, item.original_filename)
                return (
                  <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                    <td className="py-2 pr-4">
                      {kind === 'image' && src ? (
                        <img
                          src={toDirectImageUrl(src, { w: 80 }) || src}
                          alt=""
                          className="h-10 w-10 rounded object-cover border border-zinc-800"
                        />
                      ) : (
                        <span className="font-mono text-xs text-zinc-500">{kind}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-zinc-200">{item.title}</td>
                    <td className="py-2 pr-4 text-zinc-400">{parseMediaCategory(item.category)}</td>
                    <td className="py-2 pr-4 text-zinc-400">{formatFileSize(item.file_size_bytes)}</td>
                    <td className="py-2 text-right space-x-2">
                      <MediaVisibilityToggle itemId={item.id} active={item.active ?? true} />
                      <Link
                        href={`/admin/media/${item.id}`}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          'use server'
                          await deleteMediaDownload(item.id)
                        }}
                        className="inline"
                      >
                        <button type="submit" className="text-red-400 hover:text-red-300 transition-colors">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
