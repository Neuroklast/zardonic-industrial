import { describe, expect, it } from 'vitest'
import { extractStoredObjectPath } from '@/lib/r2-url-rewrite'
import { buildR2Inventory, matchInventoryKey } from '@/lib/r2-inventory'
import { applyR2MediaReconcile } from '@/lib/r2-reconcile'
import type { MediaRewriteClient, MediaRewriteSelectResult } from '@/lib/r2-url-rewrite'

const OLD_HOST = 'https://pub-0f758eac6e4d4b2dbbaedd819e15f764.r2.dev'
const NEW_HOST = 'https://pub-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.r2.dev'
const FILENAME = '1782297715641.png-1782297716760'
const OLD_KEY = `partners/logos/cf05c662-b21e-4132-b97e-de2cd80f151e/${FILENAME}`
const NEW_KEY = `uploads/${FILENAME}`
const USER_WSRV = `https://wsrv.nl/?url=${encodeURIComponent(`${OLD_HOST}/${OLD_KEY}`)}&output=png&n=-1&w=1024`

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

function emptyTables(
  extra: Record<string, Record<string, unknown>[]>,
): Record<string, Record<string, unknown>[]> {
  return {
    releases: [],
    gallery: [],
    partners: [],
    social_links: [],
    merchandise: [],
    soundpacks: [],
    media_downloads: [],
    news_posts: [],
    bio: [],
    site_config: [],
    ...extra,
  }
}

describe('extractStoredObjectPath', () => {
  it('decodes percent-encoded wsrv url= params', () => {
    expect(extractStoredObjectPath(USER_WSRV)).toBe(OLD_KEY)
  })
})

describe('matchInventoryKey', () => {
  it('matches a unique filename even when the prefix changed after re-upload', () => {
    const inventory = buildR2Inventory([NEW_KEY, 'gallery/shot.webp'])
    expect(matchInventoryKey(OLD_KEY, inventory)).toEqual({
      status: 'matched',
      key: NEW_KEY,
      via: 'filename',
    })
  })

  it('returns ambiguous when two objects share the filename', () => {
    const inventory = buildR2Inventory([`a/${FILENAME}`, `b/${FILENAME}`])
    const match = matchInventoryKey(FILENAME, inventory)
    expect(match.status).toBe('ambiguous')
  })
})

describe('applyR2MediaReconcile', () => {
  it('rewrites partner wsrv URLs onto the key that exists in the current bucket', async () => {
    const store = emptyTables({
      partners: [
        {
          id: 'p1',
          logo_url: USER_WSRV,
          logo_storage_path: OLD_KEY,
        },
      ],
      site_config: [
        {
          key: 'background',
          value: { url: `${OLD_HOST}/bg/hero.webp`, storage_path: 'bg/hero.webp' },
        },
      ],
    })

    const result = await applyR2MediaReconcile(makeClient(store), {
      publicHost: NEW_HOST,
      objectKeys: [NEW_KEY, 'bg/hero.webp'],
      dryRun: false,
    })

    expect(result.objectCount).toBe(2)
    expect(store.partners[0].logo_url).toBe(`${NEW_HOST}/${NEW_KEY}`)
    expect(store.partners[0].logo_storage_path).toBe(NEW_KEY)
    expect((store.site_config[0].value as { url: string }).url).toBe(`${NEW_HOST}/bg/hero.webp`)
  })

  it('does not rewrite Spotify URLs when the filename is not in the bucket', async () => {
    const store = emptyTables({
      releases: [
        {
          id: 'r1',
          cover_url: 'https://i.scdn.co/image/ab67616d0000b273deadbeef',
          cover_storage_path: null,
        },
      ],
    })
    const result = await applyR2MediaReconcile(makeClient(store), {
      publicHost: NEW_HOST,
      objectKeys: [NEW_KEY],
      dryRun: false,
    })
    expect(store.releases[0].cover_url).toBe('https://i.scdn.co/image/ab67616d0000b273deadbeef')
    expect(result.rewrittenRows).toBe(0)
  })
})
