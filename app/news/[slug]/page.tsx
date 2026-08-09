import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import { toDirectImageUrl } from '@/lib/image-cache'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'

interface NewsPostRow {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string
  cover_storage_path: string | null
  cover_url: string | null
  published_at: string | null
}

async function loadPost(slug: string): Promise<NewsPostRow | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('news_posts')
      .select(
        'id, title, slug, excerpt, body, cover_storage_path, cover_url, published_at',
      )
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
    return (data as NewsPostRow | null) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) return { title: 'News' }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  }
}

export const revalidate = 60

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) notFound()

  const cover = resolveImageUrl(post.cover_storage_path, post.cover_url)
  const dateLabel = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <LegalPageShell>
      <article className="mx-auto max-w-3xl px-card py-section">
        <Link
          href="/#news"
          className="mb-8 inline-flex font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to news
        </Link>

        {cover ? (
          <div className="mb-8 aspect-video overflow-hidden border border-border bg-muted">
            <img
              src={toDirectImageUrl(cover, { w: 1200 }) || cover}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {dateLabel ? (
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {dateLabel}
          </p>
        ) : null}

        <h1
          className="mb-6 text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl"
          style={{ fontFamily: 'var(--font-heading, inherit)' }}
        >
          {post.title}
        </h1>

        {post.excerpt ? (
          <p
            className="mb-8 text-lg text-muted-foreground"
            style={{ fontFamily: 'var(--font-body, inherit)' }}
          >
            {post.excerpt}
          </p>
        ) : null}

        <div
          className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90"
          style={{ fontFamily: 'var(--font-body, inherit)' }}
        >
          {post.body}
        </div>
      </article>
    </LegalPageShell>
  )
}
