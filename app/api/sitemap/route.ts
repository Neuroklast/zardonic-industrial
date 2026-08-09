import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

/** Rebuild periodically so new news posts appear without redeploy. */
export const revalidate = 3600

const BASE_URL = process.env.SITE_URL?.replace(/\/$/, '') || 'https://zardonic.com'

type SitemapUrl = { loc: string; changefreq: string; priority: string; lastmod?: string }

const STATIC_URLS: SitemapUrl[] = [
  { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE_URL}/releases`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${BASE_URL}/gigs`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${BASE_URL}/legal-notice`, changefreq: 'monthly', priority: '0.3' },
  { loc: `${BASE_URL}/privacy-policy`, changefreq: 'monthly', priority: '0.3' },
  { loc: `${BASE_URL}/newsletter/unsubscribe`, changefreq: 'yearly', priority: '0.2' },
]

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildSitemap(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map(({ loc, changefreq, priority, lastmod }) => {
      const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodLine}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

interface NewsSitemapRow {
  slug: string
  published_at: string | null
  updated_at: string | null
}

async function fetchNewsUrls(): Promise<SitemapUrl[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('news_posts')
      .select('slug, published_at, updated_at')
      .eq('active', true)
      .order('published_at', { ascending: false })
      .limit(200)

    const rows = (data ?? []) as NewsSitemapRow[]
    return rows
      .filter((row) => typeof row.slug === 'string' && row.slug.length > 0)
      .map((row) => {
        const last = row.updated_at || row.published_at
        return {
          loc: `${BASE_URL}/news/${encodeURIComponent(row.slug)}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: last ? new Date(last).toISOString().slice(0, 10) : undefined,
        }
      })
  } catch {
    return []
  }
}

export async function GET(): Promise<NextResponse> {
  const newsUrls = await fetchNewsUrls()
  const xml = buildSitemap([...STATIC_URLS, ...newsUrls])
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
