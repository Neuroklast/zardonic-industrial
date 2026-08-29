import { describe, expect, it } from 'vitest'
import {
  SITE_BACKUP_SECTIONS,
  SITE_BACKUP_VERSION,
  applySiteBackup,
  buildSiteBackup,
  chunkRows,
  chunkRowsByJsonBytes,
  fetchAllTableRows,
  listPresentBackupSections,
  normalizeRowForUpsert,
  parseSiteBackupPayload,
  pickSectionRows,
  type SiteBackupClient,
  type SiteBackupRow,
} from '@/lib/site-data-backup'

function makeClient(store: Record<string, SiteBackupRow[]>): SiteBackupClient {
  return {
    from(table: string) {
      const rowsFor = () => store[table] ?? []
      return {
        select(_columns: string, options?: { count?: 'exact'; head?: boolean }) {
          const snapshot = rowsFor()
          const result = {
            data: options?.head ? [] : snapshot,
            error: null,
            count: snapshot.length,
          }
          const promise = Promise.resolve(result)
          const query = {
            order() {
              return query
            },
            range(from: number, to: number) {
              return Promise.resolve({
                data: rowsFor().slice(from, to + 1),
                error: null,
                count: rowsFor().length,
              })
            },
          }
          return Object.assign(promise, query)
        },
        upsert(newRows: SiteBackupRow[], options?: { onConflict?: string }) {
          const list = store[table] ?? (store[table] = [])
          const conflict = options?.onConflict ?? (table === 'site_config' ? 'key' : 'id')
          for (const row of newRows) {
            const idx = list.findIndex((existing) => existing[conflict] === row[conflict])
            if (idx >= 0) list[idx] = { ...list[idx], ...row }
            else list.push({ ...row })
          }
          return Promise.resolve({ error: null })
        },
        insert(newRows: SiteBackupRow[]) {
          const list = store[table] ?? (store[table] = [])
          for (const row of newRows) {
            list.push({ id: typeof row.id === 'string' ? row.id : 'generated-id', ...row })
          }
          return Promise.resolve({ error: null })
        },
      }
    },
  }
}

describe('SITE_BACKUP_SECTIONS', () => {
  it('includes news, releases, and site_config — the tables editors actually change', () => {
    const tables = SITE_BACKUP_SECTIONS.map((section) => section.table)
    expect(tables).toContain('releases')
    expect(tables).toContain('news_posts')
    expect(tables).toContain('gigs')
    expect(tables).toContain('site_config')
    expect(tables).toContain('bio')
    expect(tables).toContain('media_downloads')
    expect(tables).not.toContain('api_secrets')
    expect(tables).not.toContain('newsletter_subscribers')
  })
})

describe('parseSiteBackupPayload', () => {
  it('rejects non-objects and empty objects', () => {
    expect(parseSiteBackupPayload(null).ok).toBe(false)
    expect(parseSiteBackupPayload([]).ok).toBe(false)
    expect(parseSiteBackupPayload({ version: 2 }).ok).toBe(false)
  })

  it('accepts v1 aliases (social, config, musicHighlights, bio object)', () => {
    const parsed = parseSiteBackupPayload({
      releases: [{ id: 'r1', title: 'Manual', manually_edited: true }],
      social: [{ id: 's1', platform: 'instagram', url: 'https://example.com' }],
      config: [{ key: 'hero', value: { headline: 'Z' } }],
      musicHighlights: [{ id: 'm1', title: 'Track' }],
      bio: { content: 'Hello' },
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const keys = listPresentBackupSections(parsed.data).map((s) => s.table)
    expect(keys).toEqual(expect.arrayContaining(['releases', 'social_links', 'site_config', 'music_highlights', 'bio']))
  })

  it('accepts canonical v2 keys including news_posts', () => {
    const parsed = parseSiteBackupPayload({
      version: SITE_BACKUP_VERSION,
      news_posts: [{ id: 'n1', title: 'Show', slug: 'show', body: 'Body' }],
      releases: [{ id: 'r1', title: 'Edit', manually_edited: true, tracks: [{ title: 'A' }] }],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(listPresentBackupSections(parsed.data).map((s) => s.table)).toEqual(
      expect.arrayContaining(['news_posts', 'releases']),
    )
  })
})

describe('normalizeRowForUpsert', () => {
  it('turns empty unique platform ids into null so UNIQUE constraints do not collide', () => {
    const section = SITE_BACKUP_SECTIONS.find((s) => s.table === 'releases')
    expect(section).toBeTruthy()
    if (!section) return
    const row = normalizeRowForUpsert(section, {
      id: 'r1',
      itunes_id: '',
      spotify_id: '   ',
      discogs_id: '123',
      manually_edited: true,
    })
    expect(row.itunes_id).toBeNull()
    expect(row.spotify_id).toBeNull()
    expect(row.discogs_id).toBe('123')
    expect(row.manually_edited).toBe(true)
  })

  it('fills a missing news slug so NOT NULL unique still holds', () => {
    const section = SITE_BACKUP_SECTIONS.find((s) => s.table === 'news_posts')
    expect(section).toBeTruthy()
    if (!section) return
    const row = normalizeRowForUpsert(section, {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      title: 'Hello',
      slug: '',
      body: 'x',
    })
    expect(row.slug).toBe('post-aaaaaaaa')
  })
})

describe('fetchAllTableRows', () => {
  it('pages past the Supabase 1000-row default', async () => {
    const releases = Array.from({ length: 1001 }, (_, i) => ({
      id: `r${i}`,
      title: `Release ${i}`,
      manually_edited: i % 2 === 0,
    }))
    const client = makeClient({ releases })
    const rows = await fetchAllTableRows(client, 'releases', 1000)
    expect(rows).toHaveLength(1001)
    expect(rows[1000]).toMatchObject({ id: 'r1000' })
  })
})

describe('buildSiteBackup + applySiteBackup', () => {
  it('round-trips manually edited releases, news, and site_config', async () => {
    const source = makeClient({
      releases: [
        {
          id: 'rel-1',
          title: 'Hand edited',
          manually_edited: true,
          tracks: [{ title: 'One', duration: 120 }],
          description: 'Custom copy',
        },
      ],
      news_posts: [{ id: 'news-1', title: 'Tour', slug: 'tour', body: 'We play Friday.', active: false }],
      gigs: [],
      gallery: [],
      bio: [{ id: 'bio-1', content: 'Industrial.' }],
      partners: [],
      social_links: [],
      music_highlights: [],
      merchandise: [],
      soundpacks: [],
      media_downloads: [],
      site_config: [{ key: 'hero', value: { headline: 'ZARDONIC' } }],
    })

    const backup = await buildSiteBackup(source)
    expect(backup.version).toBe(SITE_BACKUP_VERSION)
    expect(backup.counts.releases).toBe(1)
    expect(backup.counts.news_posts).toBe(1)
    expect(backup.releases?.[0]).toMatchObject({ manually_edited: true, title: 'Hand edited' })
    expect(backup.news_posts?.[0]).toMatchObject({ slug: 'tour', active: false })

    const dest: Record<string, SiteBackupRow[]> = {
      releases: [],
      news_posts: [],
      gigs: [],
      gallery: [],
      bio: [],
      partners: [],
      social_links: [],
      music_highlights: [],
      merchandise: [],
      soundpacks: [],
      media_downloads: [],
      site_config: [],
    }
    const imported = await applySiteBackup(makeClient(dest), backup)
    expect(imported.imported.releases).toBe(1)
    expect(imported.imported.news_posts).toBe(1)
    expect(imported.imported.site_config).toBe(1)
    expect(dest.releases[0]).toMatchObject({
      id: 'rel-1',
      manually_edited: true,
      tracks: [{ title: 'One', duration: 120 }],
    })
    expect(dest.news_posts[0]).toMatchObject({ slug: 'tour', body: 'We play Friday.' })
    expect(dest.site_config[0]).toMatchObject({ key: 'hero' })
  })

  it('imports a v1 backup that used social/config aliases and a lone bio object', async () => {
    const parsed = parseSiteBackupPayload({
      social: [{ id: 'soc-1', platform: 'youtube', url: 'https://youtube.com/x' }],
      config: [{ key: 'legal', value: { operatorName: 'Zardonic' } }],
      bio: { content: 'From the old exporter' },
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const dest: Record<string, SiteBackupRow[]> = { social_links: [], site_config: [], bio: [] }
    const imported = await applySiteBackup(makeClient(dest), parsed.data)
    expect(imported.imported.social_links).toBe(1)
    expect(imported.imported.site_config).toBe(1)
    expect(imported.imported.bio).toBe(1)
    expect(dest.bio[0]).toMatchObject({ content: 'From the old exporter' })
  })
})

describe('chunkRows', () => {
  it('splits into fixed-size chunks', () => {
    const rows = [1, 2, 3, 4, 5]
    expect(chunkRows(rows, 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunkRows([], 2)).toEqual([])
  })
})

describe('chunkRowsByJsonBytes', () => {
  it('keeps a single large row in its own chunk', () => {
    const rows = [{ id: 'a', body: 'x'.repeat(100) }, { id: 'b', body: 'y'.repeat(100) }]
    const chunks = chunkRowsByJsonBytes(rows, 150)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.flat().map((row) => row.id)).toEqual(['a', 'b'])
  })

  it('returns empty for no rows', () => {
    expect(chunkRowsByJsonBytes([])).toEqual([])
  })
})

describe('pickSectionRows', () => {
  it('prefers the first matching import key', () => {
    const section = SITE_BACKUP_SECTIONS.find((s) => s.table === 'social_links')
    expect(section).toBeTruthy()
    if (!section) return
    const rows = pickSectionRows(
      {
        version: 1,
        exportedAt: '',
        counts: {},
        social: [{ id: 'legacy' }],
        social_links: [{ id: 'canonical' }],
      },
      section,
    )
    expect(rows[0]).toMatchObject({ id: 'canonical' })
  })
})
