import { ADMIN_NAV_GROUPS } from '@/app/admin/_config/nav-groups'

export interface AdminHelpEntry {
  id: string
  title: string
  description: string
  href: string
  group: string
  keywords: string[]
  /** Higher = shown first when browsing with an empty query */
  priority?: number
}

const SITE_CONFIG = '/admin/site-config'

const SITE_CONFIG_TABS: AdminHelpEntry[] = [
  {
    id: 'site-config-theme',
    title: 'Theme & Typography',
    description:
      'Change accent color, heading color, muted text, fonts, heading size, glitch/chromatic effects and card styling. Heading size only affects section titles, not release cards.',
    href: `${SITE_CONFIG}?tab=theme`,
    group: 'Look & Feel',
    keywords: ['appearance', 'colors', 'font', 'typography', 'heading', 'theme', 'design', 'glitch'],
    priority: 90,
  },
  {
    id: 'site-config-background',
    title: 'Background',
    description:
      'Set a full-page background image or video, adjust overlay darkness, and control how the background scrolls behind sections.',
    href: `${SITE_CONFIG}?tab=background`,
    group: 'Look & Feel',
    keywords: ['background', 'video', 'image', 'overlay', 'parallax', 'wallpaper'],
    priority: 85,
  },
  {
    id: 'site-config-hero',
    title: 'Hero Section',
    description:
      'Edit headline, tagline, CTA button, hero background image/video, and the wordmark logo. Upload images with pan/zoom crop; files are optimized to WebP.',
    href: `${SITE_CONFIG}?tab=hero`,
    group: 'Look & Feel',
    keywords: ['hero', 'headline', 'tagline', 'cta', 'logo', 'wordmark', 'banner', 'top'],
    priority: 88,
  },
  {
    id: 'site-config-sections',
    title: 'Sections Order & Visibility',
    description:
      'Drag to reorder homepage sections, toggle visibility, and edit each section heading and intro text. Navigation links follow this order automatically.',
    href: `${SITE_CONFIG}?tab=sections`,
    group: 'Look & Feel',
    keywords: ['sections', 'order', 'visibility', 'headings', 'navbar', 'navigation', 'homepage', 'sort'],
    priority: 87,
  },
  {
    id: 'site-config-text',
    title: 'Site Text & Footer Links',
    description:
      'Edit newsletter body text, merchandise footer copy, and paths to Legal Notice / Privacy Policy pages.',
    href: `${SITE_CONFIG}?tab=text`,
    group: 'Look & Feel',
    keywords: ['newsletter', 'merchandise', 'footer', 'legal notice', 'privacy policy', 'text', 'copy'],
    priority: 70,
  },
  {
    id: 'site-config-advanced',
    title: 'Advanced JSON Editors',
    description:
      'Raw JSON editors for power users. Prefer the tabs above for everyday changes — invalid JSON can break the public site.',
    href: `${SITE_CONFIG}?tab=advanced`,
    group: 'Look & Feel',
    keywords: ['advanced', 'json', 'raw', 'site_config', 'power user'],
    priority: 30,
  },
]

const NAV_ENTRIES: AdminHelpEntry[] = ADMIN_NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    id: `nav-${item.href.replace(/\//g, '-').replace(/^-/, '')}`,
    title: item.label,
    description: navDescription(item.href, item.label),
    href: item.href,
    group: group.label,
    keywords: navKeywords(item.href, item.label),
    priority: item.href === '/admin' ? 95 : item.href === '/admin/site-config' ? 92 : 60,
  }))
)

const ACTION_ENTRIES: AdminHelpEntry[] = [
  {
    id: 'gallery-new',
    title: 'Add Gallery Image',
    description: 'Upload a new image to the public gallery. Supports crop, WebP optimization and R2 storage.',
    href: '/admin/gallery/new',
    group: 'Content',
    keywords: ['gallery', 'new', 'upload', 'image', 'photo', 'add', 'create'],
    priority: 55,
  },
  {
    id: 'releases-new',
    title: 'Add Release Manually',
    description:
      'Create a release by hand when it is not in Spotify/iTunes. Add cover art, tracklist, streaming links and visibility.',
    href: '/admin/releases/new',
    group: 'Content',
    keywords: ['release', 'album', 'single', 'new', 'add', 'discography', 'manual', 'create'],
    priority: 65,
  },
  {
    id: 'gigs-new',
    title: 'Add Event',
    description: 'Create a gig or event manually. Bandsintown sync can also import upcoming shows automatically.',
    href: '/admin/gigs/new',
    group: 'Content',
    keywords: ['gig', 'event', 'show', 'concert', 'new', 'add', 'bandsintown', 'create'],
    priority: 55,
  },
  {
    id: 'music-highlights-new',
    title: 'Add Music Highlight',
    description: 'Feature a track or playlist on the homepage music highlights section.',
    href: '/admin/music-highlights/new',
    group: 'Content',
    keywords: ['highlight', 'track', 'playlist', 'music', 'new', 'add', 'feature'],
    priority: 50,
  },
  {
    id: 'merchandise-new',
    title: 'Add Merchandise Item',
    description: 'Add a merch product with image, price, store link and display order.',
    href: '/admin/merchandise/new',
    group: 'Content',
    keywords: ['merch', 'merchandise', 'shop', 'store', 'product', 'new', 'add'],
    priority: 50,
  },
  {
    id: 'soundpacks-new',
    title: 'Add Soundpack',
    description: 'Publish a downloadable soundpack with preview, price and purchase link.',
    href: '/admin/soundpacks/new',
    group: 'Content',
    keywords: ['soundpack', 'sample', 'pack', 'download', 'new', 'add'],
    priority: 50,
  },
  {
    id: 'sections-standalone',
    title: 'Sections (standalone page)',
    description:
      'Alternative page for section order and visibility — same controls as Look & Feel → Sections tab.',
    href: '/admin/sections',
    group: 'Look & Feel',
    keywords: ['sections', 'order', 'visibility', 'standalone'],
    priority: 40,
  },
]

const HOWTO_ENTRIES: AdminHelpEntry[] = [
  {
    id: 'help-search',
    title: 'Admin Help & Quick Search',
    description:
      'Press Ctrl+K (or ⌘K on Mac) anywhere in admin to search all functions, settings and how-to guides. Click a result to jump directly to that page or setting.',
    href: '/admin',
    group: 'Help',
    keywords: ['help', 'search', 'find', 'shortcut', 'keyboard', 'command palette', 'schnellsuche'],
    priority: 100,
  },
  {
    id: 'help-live-preview',
    title: 'How does live preview work?',
    description:
      'Look & Feel editors broadcast drafts to a split preview pane. Changes appear instantly before you save. Save to persist to the public site (~60s cache).',
    href: `${SITE_CONFIG}?tab=theme`,
    group: 'Help',
    keywords: ['preview', 'live', 'draft', 'split', 'see changes', 'before save'],
    priority: 80,
  },
  {
    id: 'help-image-upload',
    title: 'How do I upload and crop images?',
    description:
      'Use the image uploader on Hero, Gallery, Releases, etc. Drag to pan, scroll to zoom, then confirm. All uploads are converted to WebP and stored on Cloudflare R2.',
    href: `${SITE_CONFIG}?tab=hero`,
    group: 'Help',
    keywords: ['upload', 'crop', 'pan', 'zoom', 'image', 'webp', 'r2', 'photo'],
    priority: 75,
  },
  {
    id: 'help-hero-wordmark',
    title: 'How do I change the hero wordmark?',
    description:
      'Go to Look & Feel → Hero. The wordmark logo is separate from the hero background — upload or replace it in the logo/wordmark field.',
    href: `${SITE_CONFIG}?tab=hero`,
    group: 'Help',
    keywords: ['wordmark', 'logo', 'hero', 'brand', 'header image'],
    priority: 74,
  },
  {
    id: 'help-theme-colors',
    title: 'How do I change site colors?',
    description:
      'Look & Feel → Theme. Adjust accent, heading and muted foreground colors. Body text color follows the theme — only headings have a separate color control.',
    href: `${SITE_CONFIG}?tab=theme`,
    group: 'Help',
    keywords: ['color', 'accent', 'red', 'theme', 'appearance', 'palette'],
    priority: 73,
  },
  {
    id: 'help-sections-navbar',
    title: 'How does the navigation menu work?',
    description:
      'Public nav links are built from visible sections in Look & Feel → Sections. Reorder or hide sections there — the menu updates automatically after save.',
    href: `${SITE_CONFIG}?tab=sections`,
    group: 'Help',
    keywords: ['navbar', 'navigation', 'menu', 'links', 'sections', 'order'],
    priority: 72,
  },
  {
    id: 'help-legal',
    title: 'How do I set legal / privacy info?',
    description:
      'Legal & Privacy stores operator identity (name, address, VAT) in site_config.legal. Optional full privacy policy override. Footer URLs are in Look & Feel → Site Text.',
    href: '/admin/legal',
    group: 'Help',
    keywords: ['legal', 'privacy', 'gdpr', 'impressum', 'operator', 'vat', 'address', 'datenschutz'],
    priority: 71,
  },
  {
    id: 'help-release-sync',
    title: 'How do I sync releases from Spotify / iTunes?',
    description:
      'Catalogue Sync bulk-imports from Spotify, iTunes or Discogs. Per-release: paste platform URLs on the edit form and click Sync for metadata, cover and tracklist.',
    href: '/admin/releases/sync',
    group: 'Help',
    keywords: ['sync', 'spotify', 'itunes', 'discogs', 'import', 'catalogue', 'album', 'metadata'],
    priority: 70,
  },
  {
    id: 'help-tracklist',
    title: 'How do I reload a release tracklist?',
    description:
      'Open the release edit form → Reload tracklist. Fetches tracks from Spotify → Discogs → iTunes and Odesli streaming links. Data maintenance can batch-enrich all releases.',
    href: '/admin/data',
    group: 'Help',
    keywords: ['tracklist', 'tracks', 'reload', 'enrich', 'odesli', 'spotify tracks'],
    priority: 68,
  },
  {
    id: 'help-gigs-sync',
    title: 'How do I sync events from Bandsintown?',
    description:
      'Events page has a Bandsintown sync button. Data maintenance can purge and re-sync all gigs. Manual events can be added via Add Event.',
    href: '/admin/gigs',
    group: 'Help',
    keywords: ['bandsintown', 'gigs', 'events', 'sync', 'shows', 'tour'],
    priority: 67,
  },
  {
    id: 'help-data-maintenance',
    title: 'What does data maintenance do?',
    description:
      'Import/Export page: enrich all tracklists, reset tracklists, purge+sync releases (Spotify), purge+sync gigs (Bandsintown). Expert actions need confirmation.',
    href: '/admin/data',
    group: 'Help',
    keywords: ['maintenance', 'purge', 'enrich', 'reset', 'import', 'export', 'backup', 'data'],
    priority: 66,
  },
  {
    id: 'help-translations',
    title: 'How do I edit UI translations?',
    description:
      'Translations editor overrides public UI strings per locale. Changes apply after save and cache revalidation.',
    href: '/admin/translations',
    group: 'Help',
    keywords: ['translations', 'locale', 'language', 'i18n', 'strings', 'text'],
    priority: 55,
  },
  {
    id: 'help-sign-in',
    title: 'How does admin sign-in work?',
    description:
      'Sign in at /admin/login with email/password. Uses server-side auth (not browser Supabase client) to avoid cookie race issues. Requires profiles.role = admin.',
    href: '/admin/login',
    group: 'Help',
    keywords: ['login', 'sign in', 'password', 'auth', 'access', 'admin role'],
    priority: 45,
  },
  {
    id: 'help-api-keys',
    title: 'What are API keys for?',
    description:
      'Manage API keys for external integrations and cron endpoints. Keep secrets out of client-side code.',
    href: '/admin/api-keys',
    group: 'Help',
    keywords: ['api', 'keys', 'token', 'secret', 'cron', 'integration'],
    priority: 40,
  },
  {
    id: 'help-analytics',
    title: 'How do I view analytics?',
    description:
      'Analytics dashboard shows site traffic when configured in site_config. Respects visitor cookie consent.',
    href: '/admin/analytics',
    group: 'Help',
    keywords: ['analytics', 'traffic', 'visitors', 'stats', 'plausible', 'umami'],
    priority: 40,
  },
  {
    id: 'help-health',
    title: 'What is API Health?',
    description:
      'Checks connectivity to external APIs (Spotify, Discogs, Bandsintown, etc.) used by sync and enrichment jobs.',
    href: '/admin/health',
    group: 'Help',
    keywords: ['health', 'api', 'status', 'connectivity', 'spotify', 'discogs'],
    priority: 35,
  },
]

function navDescription(href: string, label: string): string {
  const map: Record<string, string> = {
    '/admin': 'Overview of content counts and quick links to common admin tasks.',
    '/admin/site-config': 'Theme, background, hero, sections and site text with live split preview.',
    '/admin/legal': 'Operator identity, editorial responsibility and optional privacy policy override.',
    '/admin/translations': 'Override public UI strings per locale.',
    '/admin/bio': 'Artist biography shown on the homepage bio section.',
    '/admin/gallery': 'Manage public gallery images — upload, reorder and delete.',
    '/admin/partners': 'Credits, endorsements and partner logos with inline add form.',
    '/admin/music-highlights': 'Featured tracks or playlists on the homepage.',
    '/admin/releases': 'Full discography — edit, hide, delete or open per-release sync.',
    '/admin/releases/sync': 'Bulk import catalogue from Spotify, iTunes or Discogs.',
    '/admin/gigs': 'Upcoming and past events; Bandsintown sync available.',
    '/admin/merchandise': 'Merch grid items with store links and images.',
    '/admin/soundpacks': 'Downloadable soundpacks with previews and purchase URLs.',
    '/admin/social': 'Social media profile links shown on the site.',
    '/admin/newsletter': 'View newsletter subscribers and export list.',
    '/admin/analytics': 'Site traffic and visitor statistics.',
    '/admin/api-keys': 'API keys for integrations and secured cron routes.',
    '/admin/health': 'External API connectivity status for sync jobs.',
    '/admin/data': 'JSON import/export plus data maintenance (enrich, purge, sync).',
  }
  return map[href] ?? `Open ${label} in the admin panel.`
}

function navKeywords(href: string, label: string): string[] {
  const extra: Record<string, string[]> = {
    '/admin/site-config': ['look and feel', 'design', 'config', 'settings'],
    '/admin/legal': ['gdpr', 'privacy', 'impressum', 'legal notice'],
    '/admin/releases': ['album', 'single', 'ep', 'discography', 'music'],
    '/admin/releases/sync': ['spotify', 'itunes', 'discogs', 'import', 'catalogue'],
    '/admin/gigs': ['bandsintown', 'concert', 'tour', 'live'],
    '/admin/partners': ['credits', 'endorsement', 'collaboration', 'logo'],
    '/admin/data': ['backup', 'export', 'import', 'maintenance', 'enrich'],
  }
  return [label.toLowerCase(), ...(extra[href] ?? [])]
}

/** All searchable admin help entries (nav, sub-tabs, actions, how-to). */
export const ADMIN_HELP_INDEX: AdminHelpEntry[] = [
  ...HOWTO_ENTRIES,
  ...NAV_ENTRIES,
  ...SITE_CONFIG_TABS,
  ...ACTION_ENTRIES,
]

/** Unique groups in display order. */
export const ADMIN_HELP_GROUPS: string[] = [
  'Help',
  'Overview',
  'Look & Feel',
  'Site',
  'Content',
  'System',
]