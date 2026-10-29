import { createHash } from 'node:crypto'
import { z } from 'zod'

/**
 * The MCP surface is a deliberate content allowlist, not a general database API.
 * OWASP A01: Never accept table or column names outside this registry.
 * Commerce, personal data, credentials, integrations, and legal documents are excluded.
 */
const short = z.string().trim().min(1).max(240)
const text = z.string().max(30000)
const nullableText = text.nullable()
const httpsUrl = z.string().url().max(2048).refine((s) => s.startsWith('https://'), 'HTTPS required')
const url = httpsUrl.nullable()
const streamingLinks = z.array(z.object({
  platform: short, url: httpsUrl, label: short.optional(),
}).strict()).max(50)
const customLinks = z.array(z.object({ label: short, url: httpsUrl }).strict()).max(50)
const tracks = z.array(z.object({
  title: short, duration: short.optional(), artist: short.optional(), featuredArtists: z.array(short).max(30).optional(),
}).strict()).max(300)
const order = z.number().int().min(-10000).max(10000)
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(s)))
const instant = z.string().datetime({ offset: true })
const strings = z.array(z.string().max(300)).max(200)
const nullableShort = short.nullable()

const EDITABLE = {
  news_posts: {
    create: true,
    required: ['title', 'slug'],
    fields: { title: short, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), excerpt: nullableText, body: text, cover_storage_path: nullableShort, cover_url: url, published_at: instant, display_order: order, active: z.boolean() },
  },
  gigs: {
    create: true,
    required: ['title', 'event_date'],
    fields: { title: short, event_date: instant, venue: nullableText, city: nullableShort, country: nullableShort, ticket_url: url, festival_name: nullableText, description: nullableText, active: z.boolean() },
  },
  releases: {
    create: true,
    required: ['title', 'type'],
    fields: { title: short, type: z.enum(['album', 'ep', 'single', 'song', 'remix', 'compilation']), release_date: date.nullable(), description: nullableText, cover_storage_path: nullableShort, cover_url: url, streaming_links: streamingLinks, tracks, custom_links: customLinks, artists: strings, active: z.boolean(), display_order: order },
  },
  bio: {
    create: false,
    required: [],
    fields: { content: text },
  },

  gallery: {
    create: false,
    required: [],
    fields: { alt: nullableText, caption: nullableText, display_order: order, active: z.boolean() },
  },
  media_downloads: {
    create: false,
    required: [],
    fields: { title: short, description: nullableText, category: z.enum(['photo', 'logo', 'document', 'audio', 'other']), display_order: order, active: z.boolean() },
  },
  partners: {
    create: true,
    required: ['name'],
    fields: { name: short, url, category: nullableShort, display_order: order, active: z.boolean(), logo_white: z.boolean() },
  },
  social_links: {
    create: true,
    required: ['platform', 'url'],
    fields: { platform: short, url: z.string().url().max(2048).refine((s) => s.startsWith('https://'), 'HTTPS required'), label: nullableShort, display_order: order, active: z.boolean() },
  },
  music_highlights: {
    create: true,
    required: ['title', 'youtube_url'],
    fields: { title: short, youtube_url: z.string().url().max(2048).refine((s) => s.startsWith('https://'), 'HTTPS required'), description: nullableText, display_order: order, active: z.boolean() },
  },
  merchandise: {
    create: true,
    required: ['title'],
    fields: { title: short, external_url: url, display_order: order, active: z.boolean() },
  },

  soundpacks: {
    create: false,
    required: [],
    fields: { title: short, external_url: url, display_order: order, active: z.boolean() },
  },
} satisfies Record<string, { create: boolean; required: string[]; fields: Record<string, z.ZodType> }>

export type ContentCollection = keyof typeof EDITABLE
export const CONTENT_COLLECTIONS = Object.keys(EDITABLE) as ContentCollection[]
export const MCP_REMOVABLE_COLLECTIONS: readonly ContentCollection[] = ['news_posts', 'gigs', 'releases', 'bio', 'gallery', 'media_downloads', 'partners', 'social_links', 'music_highlights', 'merchandise']
export function mayRemoveMcpContent(collection: string): boolean {
  return MCP_REMOVABLE_COLLECTIONS.some((name) => name === collection)
}

export const CONTENT_CONFIG_KEYS = ['hero', 'footer', 'translations', 'sections'] as const
export type ContentConfigKey = typeof CONTENT_CONFIG_KEYS[number]

export function getContentDefinition(name: string) {
  if (!Object.prototype.hasOwnProperty.call(EDITABLE, name)) return null
  return EDITABLE[name as ContentCollection]
}

export function allowedContentFields(name: string): string[] {
  const definition = getContentDefinition(name)
  return definition ? Object.keys(definition.fields) : []
}

export function parseContentChanges(collection: string, action: 'create' | 'update', changes: unknown): Record<string, unknown> {
  const definition = getContentDefinition(collection)
  if (!definition) throw new Error('Unsupported content collection')
  if (action === 'create' && !definition.create) throw new Error('Creation is not supported for this collection')
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new Error('Changes must be a JSON object')
  const fields = definition.fields as Record<string, z.ZodType>
  const entries = Object.entries(changes)
  if (entries.length === 0 || entries.length > 25) throw new Error('Provide 1 to 25 content fields')
  if (JSON.stringify(changes).length > 32000) throw new Error('Content change exceeds size limit')
  const normalized: Record<string, unknown> = {}
  for (const [field, value] of entries) {
    const validator = fields[field]
    if (!Object.prototype.hasOwnProperty.call(fields, field) || !validator) throw new Error('Field not writable: ' + field)
    const parsed = validator.safeParse(value)
    if (!parsed.success) throw new Error('Invalid ' + field + ': ' + parsed.error.issues[0]?.message)
    normalized[field] = parsed.data
  }
  if (action === 'create') {
    for (const field of definition.required) {
      if (normalized[field] === undefined) throw new Error('Required field missing: ' + field)
    }
    // The proposal itself is never public. On explicit MFA-backed approval,
    // new releases publish to the artist discography; other content stays draft.
    if ('active' in fields) normalized.active = false
  }
  return normalized
}

export function digestContent(row: Record<string, unknown> | null): string {
  return createHash('sha256').update(JSON.stringify(row ?? null)).digest('hex')
}

export function filterContentRow(collection: string, row: Record<string, unknown>): Record<string, unknown> {
  const allowed = allowedContentFields(collection)
  return Object.fromEntries([['id', row.id], ...allowed.filter((k) => Object.prototype.hasOwnProperty.call(row, k)).map((k) => [k, row[k]])])
}
