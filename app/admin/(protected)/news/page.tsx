import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { deleteNewsPost, toggleNewsPostVisibility } from '@/app/admin/_actions/news'
import { resolveImageUrl } from '@/lib/r2'
import { toDirectImageUrl } from '@/lib/image-cache'

export default async function NewsAdminPage() {
  let posts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    cover_storage_path: string | null
    cover_url: string | null
    published_at: string | null
    active: boolean
    display_order: number
  }> = []

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
        description="Homepage news cards and individual post pages at /news/[slug]."
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-400">
                <th className="py-2 pr-4">Cover</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">Published</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const cover = resolveImageUrl(post.cover_storage_path, post.cover_url)
                return (
                  <tr key={post.id} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded bg-zinc-800">
                        {cover ? (
                          <img
                            src={toDirectImageUrl(cover, { w: 96 }) || cover}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-zinc-200">{post.title}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-zinc-500">{post.slug}</td>
                    <td className="py-2 pr-4 text-zinc-400">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <form
                        action={async () => {
                          'use server'
                          await toggleNewsPostVisibility(post.id, !post.active)
                        }}
                      >
                        <button
                          type="submit"
                          className={`text-xs ${post.active ? 'text-green-400' : 'text-zinc-500'}`}
                        >
                          {post.active ? 'Visible' : 'Hidden'}
                        </button>
                      </form>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/news/${post.id}`}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Edit
                        </Link>
                        <form
                          action={async () => {
                            'use server'
                            await deleteNewsPost(post.id)
                          }}
                        >
                          <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                            Delete
                          </button>
                        </form>
                      </div>
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
