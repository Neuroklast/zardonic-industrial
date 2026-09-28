import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { NewsSortable, type NewsListRow } from './NewsSortable'

export default async function NewsAdminPage() {
  let posts: NewsListRow[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('news_posts')
      .select(
        'id, title, slug, excerpt, cover_storage_path, cover_url, published_at, active, display_order',
      )
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false })
    posts = data ?? []
  } catch {
    // empty
  }

  return (
    <div>
      <AdminPageHeader
        title="News / Blog"
        description="Homepage news cards and individual post pages at /news/[slug]. Drag rows to reorder."
        action={
          <Link
            href="/admin/news/new"
            className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-600"
          >
            + New Post
          </Link>
        }
      />

      {posts.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No posts yet. Create one, then ensure the News section is visible under Look &amp; Feel →
          Sections.
        </p>
      ) : (
        <NewsSortable initialPosts={posts} />
      )}
    </div>
  )
}
