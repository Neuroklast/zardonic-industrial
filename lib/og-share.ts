import { resolveImageUrl } from '@/lib/r2'

export interface OgMeta {
  title: string
  description: string
  image: string
  hash: string
}

const FALLBACK_TITLE = process.env.SITE_NAME || 'Zardonic'
const FALLBACK_DESCRIPTION = process.env.SITE_DESCRIPTION || ''
const FALLBACK_IMAGE = '/og-image.png'

export function getSiteOrigin(): string {
  return process.env.SITE_URL?.replace(/\/$/, '') || 'https://zardonic.com'
}

export function escHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function plainText(str: string | undefined, maxLen = 200): string {
  if (!str) return ''
  const plain = String(str)
    .replace(/[<>]/g, '')
    .replace(/[#*_~`\-[\]()!]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface ReleaseRow {
  id: string
  title: string
  type: string | null
  description: string | null
  cover_storage_path: string | null
  cover_url: string | null
}

interface GigRow {
  id: string
  title: string
  venue: string | null
  city: string | null
  country: string | null
  event_date: string
}

export function resolveReleaseOg(release: ReleaseRow, artistName: string): OgMeta {
  const typeLabel = release.type ? ` (${release.type.toUpperCase()})` : ''
  const image =
    resolveImageUrl(release.cover_storage_path, release.cover_url) || FALLBACK_IMAGE
  return {
    title: `${release.title}${typeLabel} – ${artistName}`,
    description:
      plainText(release.description ?? undefined) ||
      `${release.title} by ${artistName}`,
    image,
    hash: `#releases`,
  }
}

export function resolveGigOg(gig: GigRow, artistName: string): OgMeta {
  const location = [gig.venue, gig.city, gig.country].filter(Boolean).join(', ')
  const dateStr = fmtDate(gig.event_date)
  return {
    title: `${artistName} @ ${gig.venue ?? gig.title}`,
    description: `${dateStr} – ${location}`,
    image: FALLBACK_IMAGE,
    hash: `#gigs`,
  }
}

export function fallbackOg(type: string): OgMeta {
  return {
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    image: FALLBACK_IMAGE,
    hash: type === 'gig' ? '#gigs' : '#releases',
  }
}

export function buildOgHtml(origin: string, meta: OgMeta, siteName: string): string {
  const title = escHtml(meta.title)
  const description = escHtml(meta.description)
  const image = meta.image.startsWith('/') ? `${origin}${meta.image}` : meta.image
  const canonical = `${origin}/${escHtml(meta.hash)}`
  const redirect = `${origin}/${meta.hash}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${escHtml(image)}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${escHtml(siteName)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${escHtml(image)}"/>
<meta http-equiv="refresh" content="0;url=${escHtml(redirect)}"/>
</head>
<body></body>
</html>`
}