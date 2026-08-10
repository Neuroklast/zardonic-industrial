'use client'

import Link from 'next/link'
import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import { toDirectImageUrl } from '@/lib/image-cache'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'

export interface NewsPostCard {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverUrl: string | null
  publishedAt: string | null
}

interface NewsSectionProps {
  posts: NewsPostCard[]
  heading?: string
  intro?: string
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function NewsSection({ posts, heading, intro }: NewsSectionProps) {
  const { t } = useLocale()
  const title = resolveSectionHeading(heading, 'news', t)

  return (
    <SectionWrapper id="news" data-theme-color="foreground card border primary">
      <SectionHeading sectionId="news" dataText={title}>
        {title}
      </SectionHeading>
      <SectionIntro sectionId="news">{intro}</SectionIntro>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="group block overflow-hidden border border-border bg-card/40 transition-colors hover:border-primary/40"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                {post.coverUrl ? (
                  <img
                    src={toDirectImageUrl(post.coverUrl, { w: 800 }) || post.coverUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                    NEWS
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                {post.publishedAt ? (
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {formatDate(post.publishedAt)}
                  </p>
                ) : null}
                <h3
                  className="text-base font-semibold uppercase tracking-wide text-foreground"
                  style={{ fontFamily: 'var(--font-heading, inherit)' }}
                >
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p
                    className="line-clamp-3 text-sm text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body, inherit)' }}
                  >
                    {post.excerpt}
                  </p>
                ) : null}
                <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary">
                  Read more →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <SectionEmpty label="News coming soon" />
      )}
    </SectionWrapper>
  )
}
