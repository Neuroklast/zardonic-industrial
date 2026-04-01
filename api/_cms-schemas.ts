/**
 * Zod schemas for CMS API endpoints.
 * OWASP A03:2021 — Injection: Strict input validation for all CMS inputs.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Site Config
// ---------------------------------------------------------------------------

export const siteConfigSchema = z.object({
  siteName: z.string().min(1).max(200).optional(),
  tagline: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().max(2000).optional().nullable(),
  faviconUrl: z.string().url().max(2000).optional().nullable(),
  socialLinks: z.record(z.string().max(2000)).optional(),
  footerText: z.string().max(1000).optional().nullable(),
  analyticsId: z.string().max(200).optional().nullable(),
  customCss: z.string().max(50000).optional().nullable(),
})

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const sectionCreateSchema = z.object({
  type: z.enum(['hero', 'about', 'releases', 'tour', 'videos', 'newsletter', 'custom']),
  title: z.string().max(200).optional().nullable(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  config: z.record(z.unknown()).optional(),
  content: z.record(z.unknown()).optional(),
  isDraft: z.boolean().optional(),
})

export const sectionUpdateSchema = sectionCreateSchema.partial().extend({
  id: z.string().cuid(),
})

export const sectionsReorderSchema = z.object({
  order: z.array(z.object({ id: z.string().cuid(), sortOrder: z.number().int().min(0) })),
})

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

const trackSchema = z.object({
  title: z.string().max(200),
  duration: z.string().max(20).optional(),
  featuring: z.string().max(500).optional(),
})

export const releaseCreateSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(['album', 'ep', 'single', 'remix']),
  releaseDate: z.string().datetime().optional().nullable(),
  coverUrl: z.string().url().max(2000).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  spotifyUrl: z.string().url().max(2000).optional().nullable(),
  appleMusicUrl: z.string().url().max(2000).optional().nullable(),
  bandcampUrl: z.string().url().max(2000).optional().nullable(),
  youtubeUrl: z.string().url().max(2000).optional().nullable(),
  soundcloudUrl: z.string().url().max(2000).optional().nullable(),
  odesliUrl: z.string().url().max(2000).optional().nullable(),
  tracks: z.array(trackSchema).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isDraft: z.boolean().optional(),
})

export const releaseUpdateSchema = releaseCreateSchema.partial()

// ---------------------------------------------------------------------------
// Gigs
// ---------------------------------------------------------------------------

export const gigCreateSchema = z.object({
  title: z.string().min(1).max(300),
  venue: z.string().min(1).max(300),
  city: z.string().min(1).max(200),
  country: z.string().min(1).max(200),
  date: z.string().datetime(),
  doorsOpen: z.string().max(20).optional().nullable(),
  ticketUrl: z.string().url().max(2000).optional().nullable(),
  flyerUrl: z.string().url().max(2000).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  isSoldOut: z.boolean().optional(),
  isCancelled: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  bandsinTownId: z.string().max(200).optional().nullable(),
  isDraft: z.boolean().optional(),
})

export const gigUpdateSchema = gigCreateSchema.partial()

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export const videoCreateSchema = z.object({
  title: z.string().min(1).max(300),
  youtubeId: z.string().max(20).regex(/^[A-Za-z0-9_-]+$/, 'Invalid YouTube ID').optional().nullable(),
  thumbnailUrl: z.string().url().max(2000).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  category: z.enum(['music_video', 'live', 'behind_scenes', 'remix']).optional().nullable(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isDraft: z.boolean().optional(),
})

export const videoUpdateSchema = videoCreateSchema.partial()

// ---------------------------------------------------------------------------
// Shell Members
// ---------------------------------------------------------------------------

export const shellMemberUpdateSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.enum(['entity', 'engineer']),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  socialLinks: z.record(z.string().max(2000)).optional(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// News Posts
// ---------------------------------------------------------------------------

export const newsPostCreateSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  content: z.string().max(500000),
  excerpt: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().url().max(2000).optional().nullable(),
  isDraft: z.boolean().optional(),
})

export const newsPostUpdateSchema = newsPostCreateSchema.partial()

// ---------------------------------------------------------------------------
// Biography
// ---------------------------------------------------------------------------

export const biographyUpdateSchema = z.object({
  content: z.string().max(500000).optional(),
  shortBio: z.string().max(1000).optional().nullable(),
  pressKitUrl: z.string().url().max(2000).optional().nullable(),
  photoUrls: z.array(z.string().url().max(2000)).optional(),
  isDraft: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export const publishSchema = z.object({
  entity: z.enum(['section', 'release', 'gig', 'video', 'news', 'biography']),
  id: z.string().min(1).max(200),
  action: z.enum(['publish', 'unpublish']),
})

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const mediaUpdateSchema = z.object({
  alt: z.string().max(500).optional().nullable(),
  folder: z.enum(['general', 'covers', 'flyers', 'press', 'members']).optional(),
})
