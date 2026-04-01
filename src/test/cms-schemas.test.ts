/**
 * Tests for CMS Zod schemas — validates that all input validation schemas
 * correctly accept valid data and reject invalid data.
 */

import { describe, it, expect } from 'vitest'
import {
  siteConfigSchema,
  releaseCreateSchema,
  gigCreateSchema,
  videoCreateSchema,
  shellMemberUpdateSchema,
  newsPostCreateSchema,
  biographyUpdateSchema,
  publishSchema,
  mediaUpdateSchema,
  sectionCreateSchema,
  sectionsReorderSchema,
} from '../../api/_cms-schemas'

describe('CMS Schemas — siteConfigSchema', () => {
  it('accepts a valid partial site config', () => {
    const result = siteConfigSchema.safeParse({
      siteName: 'Zardonic',
      tagline: 'Industrial Metal',
      socialLinks: { spotify: 'https://open.spotify.com/artist/xxx' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects siteName longer than 200 chars', () => {
    const result = siteConfigSchema.safeParse({ siteName: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts null values for nullable fields', () => {
    const result = siteConfigSchema.safeParse({ tagline: null, logoUrl: null })
    expect(result.success).toBe(true)
  })
})

describe('CMS Schemas — releaseCreateSchema', () => {
  it('accepts a valid release', () => {
    const result = releaseCreateSchema.safeParse({
      title: 'New Album',
      type: 'album',
      releaseDate: '2025-01-01T00:00:00.000Z',
      coverUrl: 'https://example.com/cover.jpg',
      tracks: [{ title: 'Track 1', duration: '3:45' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid release type', () => {
    const result = releaseCreateSchema.safeParse({ title: 'Test', type: 'mixtape' })
    expect(result.success).toBe(false)
  })

  it('requires title', () => {
    const result = releaseCreateSchema.safeParse({ type: 'single' })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — gigCreateSchema', () => {
  it('accepts a valid gig', () => {
    const result = gigCreateSchema.safeParse({
      title: 'Live at Berlin',
      venue: 'Berghain',
      city: 'Berlin',
      country: 'Germany',
      date: '2025-06-15T20:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects gig without required fields', () => {
    const result = gigCreateSchema.safeParse({ title: 'No venue' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date', () => {
    const result = gigCreateSchema.safeParse({
      title: 'Test', venue: 'V', city: 'C', country: 'D', date: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — videoCreateSchema', () => {
  it('accepts a valid video', () => {
    const result = videoCreateSchema.safeParse({
      title: 'Music Video',
      youtubeId: 'dQw4w9WgXcQ',
      category: 'music_video',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid YouTube ID (special chars)', () => {
    const result = videoCreateSchema.safeParse({
      title: 'Test',
      youtubeId: '<script>alert(1)</script>',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const result = videoCreateSchema.safeParse({ title: 'Test', category: 'interview' })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — shellMemberUpdateSchema', () => {
  it('accepts a valid member update', () => {
    const result = shellMemberUpdateSchema.safeParse({
      name: 'Entity 01',
      role: 'entity',
      isActive: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid role', () => {
    const result = shellMemberUpdateSchema.safeParse({ name: 'X', role: 'admin' })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — newsPostCreateSchema', () => {
  it('accepts a valid news post', () => {
    const result = newsPostCreateSchema.safeParse({
      title: 'New Post',
      slug: 'new-post',
      content: '<p>Content</p>',
    })
    expect(result.success).toBe(true)
  })

  it('rejects slug with uppercase', () => {
    const result = newsPostCreateSchema.safeParse({
      title: 'Test', slug: 'New-Post', content: 'x',
    })
    expect(result.success).toBe(false)
  })

  it('rejects slug with spaces', () => {
    const result = newsPostCreateSchema.safeParse({
      title: 'Test', slug: 'new post', content: 'x',
    })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — biographyUpdateSchema', () => {
  it('accepts a valid biography update', () => {
    const result = biographyUpdateSchema.safeParse({
      content: '<p>Bio content</p>',
      shortBio: 'Short description',
    })
    expect(result.success).toBe(true)
  })
})

describe('CMS Schemas — publishSchema', () => {
  it('accepts valid publish action', () => {
    const result = publishSchema.safeParse({ entity: 'release', id: 'abc123', action: 'publish' })
    expect(result.success).toBe(true)
  })

  it('accepts valid unpublish action', () => {
    const result = publishSchema.safeParse({ entity: 'gig', id: 'xyz', action: 'unpublish' })
    expect(result.success).toBe(true)
  })

  it('rejects unknown entity', () => {
    const result = publishSchema.safeParse({ entity: 'unknown', id: 'x', action: 'publish' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown action', () => {
    const result = publishSchema.safeParse({ entity: 'release', id: 'x', action: 'archive' })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — mediaUpdateSchema', () => {
  it('accepts valid media update', () => {
    const result = mediaUpdateSchema.safeParse({ alt: 'Image description', folder: 'covers' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid folder', () => {
    const result = mediaUpdateSchema.safeParse({ folder: 'secrets' })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — sectionCreateSchema', () => {
  it('accepts valid section', () => {
    const result = sectionCreateSchema.safeParse({ type: 'hero', enabled: true })
    expect(result.success).toBe(true)
  })

  it('rejects invalid section type', () => {
    const result = sectionCreateSchema.safeParse({ type: 'unknown' })
    expect(result.success).toBe(false)
  })
})

describe('CMS Schemas — sectionsReorderSchema', () => {
  it('accepts valid reorder payload', () => {
    const result = sectionsReorderSchema.safeParse({
      order: [
        { id: 'clxxx0000000001', sortOrder: 0 },
        { id: 'clxxx0000000002', sortOrder: 1 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-cuid ids', () => {
    const result = sectionsReorderSchema.safeParse({
      order: [{ id: 'not-a-cuid', sortOrder: 0 }],
    })
    expect(result.success).toBe(false)
  })
})
