import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import { EditNewsForm } from './EditNewsForm'

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('news_posts')
    .select(
      'id, title, slug, excerpt, body, cover_storage_path, cover_url, published_at, active, display_order',
    )
    .eq('id', id)
    .maybeSingle()

  if (!data) {
    return (
      <div>
        <p className="text-zinc-400">Post not found.</p>
        <Link href="/admin/news" className="mt-2 inline-block text-sm text-zinc-500 hover:text-white">
          ← Back
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin/news" className="mb-4 inline-block text-sm text-zinc-500 hover:text-white">
        ← News
      </Link>
      <h1 className="mb-6 text-xl font-bold">Edit News Post</h1>
      <EditNewsForm
        post={
          data as {
            id: string
            title: string
            slug: string
            excerpt: string | null
            body: string
            cover_storage_path: string | null
            cover_url: string | null
            published_at: string | null
            active: boolean
            display_order: number
          }
        }
      />
    </div>
  )
}
