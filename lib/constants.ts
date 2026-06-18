/** Bucket names for Cloudflare R2 */
export const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

/** Admin auth cookie name */
export const ADMIN_COOKIE_NAME = 'admin_session'

/** Site navigation sections */
export const NAV_SECTIONS = [
  { id: 'releases', label: 'Releases', href: '/releases' },
  { id: 'gigs', label: 'Gigs', href: '/gigs' },
  { id: 'gallery', label: 'Gallery', href: '/gallery' },
  { id: 'soundpacks', label: 'Sound Packs', href: '/soundpacks' },
  { id: 'merchandise', label: 'Merch', href: '/merch' },
] as const
