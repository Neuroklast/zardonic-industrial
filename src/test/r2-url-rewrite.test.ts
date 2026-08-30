import { afterEach, describe, expect, it } from 'vitest'
import { resolveImageUrl } from '@/lib/r2'
import {
  applyMediaHostRewrite,
  MEDIA_HOST_REWRITE_TABLES,
  canonicalizeR2MediaUrl,
  normalizeR2PublicHost,
  rewriteR2MediaJson,
  rewriteR2MediaString,
  rewriteR2MediaUrl,
  type MediaRewriteClient,
  type MediaRewriteSelectResult,
} from '@/lib/r2-url-rewrite'

const OLD_HOST = 'https://pub-0f758eac6e4d4b2dbbaedd819e15f764.r2.dev'
const NEW_HOST = 'https://pub-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.r2.dev'
const OBJECT_KEY =
  'partners/logos/cf05c662-b21e-4132-b97e-de2cd80f151e/1782297715641.png-1782297716760'
const OLD_DIRECT = `${OLD_HOST}/${OBJECT_KEY}`
const NEW_DIRECT = `${NEW_HOST}/${OBJECT_KEY}`
const USER_WSRV =
  `https://wsrv.nl/?url=${encodeURIComponent(OLD_DIRECT)}&output=png&n=-1&w=1024`

const originalPublicHost = process.env.R2_PUBLIC_HOST
const originalBucket = process.env.R2_BUCKET_MEDIA

afterEach(() => {
  if (originalPublicHost === undefined) delete process.env.R2_PUBLIC_HOST
  else process.env.R2_PUBLIC_HOST = originalPublicHost
  if (originalBucket === undefined) delete process.env.R2_BUCKET_MEDIA
  else process.env.R2_BUCKET_MEDIA = originalBucket
})

describe('normalizeR2PublicHost', () => {
  it('strips trailing slash and requires https', () => {
    expect(normalizeR2PublicHost(`${NEW_HOST}/`)).toBe(NEW_HOST)
    expect(normalizeR2PublicHost('pub-new.r2.dev')).toBe('https://pub-new.r2.dev')
    expect(normalizeR2PublicHost('http://pub-new.r2.dev')).toBeNull()
    expect(normalizeR2PublicHost('')).toBeNull()
  })
})

describe('rewriteR2MediaUrl', () => {
  it('rewrites the live partner wsrv URL onto the current public host and unwraps wsrv', () => {
    expect(rewriteR2MediaUrl(USER_WSRV, NEW_HOST)).toBe(NEW_DIRECT)
  })

  it('rewrites a bare old r2.dev URL', () => {
    expect(rewriteR2MediaUrl(OLD_DIRECT, NEW_HOST)).toBe(NEW_DIRECT)
  })

  it('unwraps wsrv even when the inner host is already current', () => {
    const wrappedCurrent = `https://wsrv.nl/?url=${encodeURIComponent(NEW_DIRECT)}&output=png&n=-1&w=1024`
    expect(rewriteR2MediaUrl(wrappedCurrent, NEW_HOST)).toBe(NEW_DIRECT)
  })

  it('leaves a direct current-host URL unchanged', () => {
    expect(rewriteR2MediaUrl(NEW_DIRECT, NEW_HOST)).toBeNull()
  })

  it('leaves Google Drive / non-R2 wsrv URLs unchanged', () => {
    const drive = 'https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/abc123&q=80&output=webp'
    expect(rewriteR2MediaUrl(drive, NEW_HOST)).toBeNull()
    expect(rewriteR2MediaUrl('https://i.scdn.co/image/deadbeef', NEW_HOST)).toBeNull()
  })

  it('strips the bucket name from r2.cloudflarestorage.com paths', () => {
    const s3 = `https://abc.r2.cloudflarestorage.com/zardonic-media/${OBJECT_KEY}`
    expect(rewriteR2MediaUrl(s3, NEW_HOST, { mediaBucket: 'zardonic-media' })).toBe(NEW_DIRECT)
  })
})

describe('canonicalizeR2MediaUrl', () => {
  it('unwraps the production 404 wsrv URL onto the current public host', () => {
    expect(canonicalizeR2MediaUrl(USER_WSRV, NEW_HOST)).toBe(NEW_DIRECT)
  })

  it('unwraps wsrv to the inner r2 URL when no public host is configured', () => {
    expect(canonicalizeR2MediaUrl(USER_WSRV, null)).toBe(OLD_DIRECT)
  })
})

describe('rewriteR2MediaString / json', () => {
  it('replaces embedded wsrv URLs in free text', () => {
    const body = `Cover: ${USER_WSRV} and more`
    const result = rewriteR2MediaString(body, NEW_HOST)
    expect(result?.replacements).toBe(1)
    expect(result?.next).toBe(`Cover: ${NEW_DIRECT} and more`)
  })

  it('walks site_config JSON including nested background.url', () => {
    const value = {
      storage_path: OBJECT_KEY,
      url: USER_WSRV,
      nested: { logoImageUrl: OLD_DIRECT },
    }
    const result = rewriteR2MediaJson(value, NEW_HOST)
    expect(result.replacements).toBe(2)
    expect(result.value).toEqual({
      storage_path: OBJECT_KEY,
      url: NEW_DIRECT,
      nested: { logoImageUrl: NEW_DIRECT },
    })
  })
})

describe('resolveImageUrl', () => {
  it('rebuilds an old wsrv/r2 fallback onto R2_PUBLIC_HOST when storage_path is empty', () => {
    process.env.R2_PUBLIC_HOST = NEW_HOST
    expect(resolveImageUrl(null, USER_WSRV)).toBe(NEW_DIRECT)
    expect(resolveImageUrl('', OLD_DIRECT)).toBe(NEW_DIRECT)
  })

  it('prefers storage_path over a stale fallback URL', () => {
    process.env.R2_PUBLIC_HOST = NEW_HOST
    expect(resolveImageUrl(OBJECT_KEY, USER_WSRV)).toBe(NEW_DIRECT)
  })
})

function makeClient(store: Record<string, Record<string, unknown>[]>): MediaRewriteClient {
  return {
    from(table: string) {
      const rowsFor = () => store[table] ?? []
      return {
        select(_columns: string) {
          return {
            order(column: string) {
              return {
                range(from: number, to: number): Promise<MediaRewriteSelectResult> {
                  const sorted = [...rowsFor()].sort((a, b) =>
                    String(a[column] ?? '').localeCompare(String(b[column] ?? '')),
                  )
                  return Promise.resolve({
                    data: sorted.slice(from, to + 1),
                    error: null,
                  })
                },
              }
            },
          }
        },
        update(values: Record<string, unknown>) {
          return {
            eq(column: string, value: string) {
              const list = store[table] ?? []
              const idx = list.findIndex((row) => row[column] === value)
              if (idx >= 0) list[idx] = { ...list[idx], ...values }
              return Promise.resolve({ error: null })
            },
          }
        },
      }
    },
  }
}

describe('applyMediaHostRewrite', () => {
  it('covers every editorial media table plus site_config', () => {
    const tables = MEDIA_HOST_REWRITE_TABLES.map((target) => target.table)
    expect(tables).toEqual(expect.arrayContaining([
      'releases',
      'gallery',
      'partners',
      'social_links',
      'merchandise',
      'soundpacks',
      'media_downloads',
      'news_posts',
      'bio',
    ]))
  })

  it('previews then applies partner logo_url + empty storage_path and site_config', async () => {
    const oldBackground = `${OLD_HOST}/bg/hero.webp`
    const store: Record<string, Record<string, unknown>[]> = {
      partners: [
        {
          id: 'p1',
          logo_url: USER_WSRV,
          logo_storage_path: null,
        },
      ],
      site_config: [
        {
          key: 'background',
          value: { url: oldBackground, storage_path: 'bg/hero.webp' },
        },
      ],
      releases: [],
      gallery: [],
      social_links: [],
      merchandise: [],
      soundpacks: [],
      media_downloads: [],
      news_posts: [],
      bio: [],
    }
    const client = makeClient(store)

    const preview = await applyMediaHostRewrite(client, {
      publicHost: NEW_HOST,
      dryRun: true,
    })
    expect(preview.rewrittenRows).toBe(2)
    expect(preview.byTable.partners).toBe(1)
    expect(preview.byTable.site_config).toBe(1)
    expect(store.partners[0].logo_url).toBe(USER_WSRV)

    const applied = await applyMediaHostRewrite(client, {
      publicHost: NEW_HOST,
      dryRun: false,
    })
    expect(applied.dryRun).toBe(false)
    expect(store.partners[0].logo_url).toBe(NEW_DIRECT)
    expect(store.partners[0].logo_storage_path).toBe(OBJECT_KEY)
    expect((store.site_config[0].value as { url: string }).url).toBe(`${NEW_HOST}/bg/hero.webp`)
  })
})
