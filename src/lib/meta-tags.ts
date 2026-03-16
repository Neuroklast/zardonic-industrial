/**
 * Meta and Open Graph tag generation from SiteConfig.
 * generateMetaTags(config) produces a MetaTagSet containing every tag
 * needed for SEO, social sharing, and browser theming.
 */

import type { SiteConfig, MetaTagSet } from './types'

const DEFAULT_DESCRIPTION = 'A music artist website'
const DEFAULT_OG_TYPE = 'website'
const DEFAULT_TWITTER_CARD = 'summary_large_image' as const
const DEFAULT_THEME_COLOR = '#000000'

function trimOrDefault(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback
}

function buildCanonical(domain: string | undefined, path = ''): string | undefined {
  if (!domain) return undefined
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  return path ? `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : base
}

function buildMusicGroupJsonLd(config: SiteConfig): object {
  const name = trimOrDefault(config.siteName, 'Artist')
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name,
  }

  if (config.description) data.description = config.description
  if (config.domain) data.url = buildCanonical(config.domain)
  if (config.logoUrl) data.image = config.logoUrl

  const sameAs: string[] = []
  const social = config.socialLinks ?? {}
  if (social.instagram) sameAs.push(social.instagram)
  if (social.facebook) sameAs.push(social.facebook)
  if (social.spotify) sameAs.push(social.spotify)
  if (social.soundcloud) sameAs.push(social.soundcloud)
  if (social.youtube) sameAs.push(social.youtube)
  if (social.bandcamp) sameAs.push(social.bandcamp)
  if (sameAs.length) data.sameAs = sameAs

  if (config.genres?.length) data.genre = config.genres

  return data
}

export function generateMetaTags(config: SiteConfig): MetaTagSet {
  const siteName = trimOrDefault(config.siteName, 'Artist Site')
  const description = trimOrDefault(
    config.description,
    config.tagline ?? DEFAULT_DESCRIPTION,
  )
  const canonical = buildCanonical(config.domain)
  const ogImage = config.seo?.ogImage ?? config.logoUrl
  const twitterCard = config.seo?.twitterCard ?? DEFAULT_TWITTER_CARD
  const themeColor =
    config.themeSettings?.background ?? DEFAULT_THEME_COLOR

  const ogTitle = config.seo?.title?.trim()
    || (config.tagline ? `${siteName} – ${config.tagline}` : siteName)

  const jsonLdObj = buildMusicGroupJsonLd(config)

  return {
    title: ogTitle,
    description,
    canonical,
    favicon: config.logoUrl,
    themeColor,
    og: {
      title: ogTitle,
      description,
      type: DEFAULT_OG_TYPE,
      url: canonical,
      image: ogImage,
      siteName,
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description,
      image: ogImage,
      site: config.seo?.twitterHandle,
    },
    jsonLd: JSON.stringify(jsonLdObj),
  }
}

export function applyMetaTags(tags: MetaTagSet): void {
  if (typeof document === 'undefined') return

  const setMeta = (selector: string, attr: string, value: string | undefined) => {
    if (!value) return
    let el = document.querySelector<HTMLMetaElement>(selector)
    if (!el) {
      el = document.createElement('meta')
      const match = selector.match(/\[([^=]+)="([^"]+)"\]/)
      if (match?.[1] && match?.[2]) el.setAttribute(match[1], match[2])
      document.head.appendChild(el)
    }
    el.setAttribute(attr, value)
  }

  const setLink = (rel: string, href: string | undefined) => {
    if (!href) return
    let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!el) {
      el = document.createElement('link')
      el.rel = rel
      document.head.appendChild(el)
    }
    el.href = href
  }

  document.title = tags.title

  setMeta('meta[name="description"]', 'content', tags.description)
  setMeta('meta[name="theme-color"]', 'content', tags.themeColor)
  setMeta('meta[property="og:title"]', 'content', tags.og.title)
  setMeta('meta[property="og:description"]', 'content', tags.og.description)
  setMeta('meta[property="og:type"]', 'content', tags.og.type)
  setMeta('meta[property="og:url"]', 'content', tags.og.url)
  setMeta('meta[property="og:image"]', 'content', tags.og.image)
  setMeta('meta[property="og:site_name"]', 'content', tags.og.siteName)
  setMeta('meta[name="twitter:card"]', 'content', tags.twitter.card)
  setMeta('meta[name="twitter:title"]', 'content', tags.twitter.title)
  setMeta('meta[name="twitter:description"]', 'content', tags.twitter.description)
  setMeta('meta[name="twitter:image"]', 'content', tags.twitter.image)
  setMeta('meta[name="twitter:site"]', 'content', tags.twitter.site)
  setLink('canonical', tags.canonical)
  setLink('icon', tags.favicon)

  if (tags.jsonLd) {
    const id = 'json-ld-main'
    let el = document.getElementById(id) as HTMLScriptElement | null
    if (!el) {
      el = document.createElement('script')
      el.id = id
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = tags.jsonLd
  }
}
