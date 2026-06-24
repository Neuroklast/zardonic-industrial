import { NextResponse } from 'next/server'

const BASE_URL = process.env.SITE_URL?.replace(/\/$/, '') || 'https://zardonic.com'

const STATIC_URLS: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE_URL}/legal-notice`, changefreq: 'monthly', priority: '0.3' },
  { loc: `${BASE_URL}/privacy-policy`, changefreq: 'monthly', priority: '0.3' },
]

function buildSitemap(urls: typeof STATIC_URLS): string {
  const urlEntries = urls
    .map(
      ({ loc, changefreq, priority }) =>
        `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

export function GET(): NextResponse {
  const xml = buildSitemap(STATIC_URLS)
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}