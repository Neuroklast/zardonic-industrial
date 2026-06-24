import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  SPOTIFY_ALBUM_TRACKS_PAGE_LIMIT,
  SPOTIFY_ARTIST_ALBUMS_PAGE_LIMIT,
  SPOTIFY_SEARCH_PAGE_LIMIT,
} from '@/lib/spotify-api-limits'

describe('spotify API page limits', () => {
  it('uses Feb 2026 caps for artist albums and search', () => {
    expect(SPOTIFY_ARTIST_ALBUMS_PAGE_LIMIT).toBe(10)
    expect(SPOTIFY_SEARCH_PAGE_LIMIT).toBe(10)
    expect(SPOTIFY_ALBUM_TRACKS_PAGE_LIMIT).toBe(50)
  })

  it('catalogue sync requests artist albums with limit 10', () => {
    const source = readFileSync(resolve(import.meta.dirname, '../../lib/spotify-sync.ts'), 'utf8')
    expect(source).toContain('limit=${SPOTIFY_ARTIST_ALBUMS_PAGE_LIMIT}')
    expect(source).not.toMatch(/artists\/\$\{[^}]+\}\/albums\?[^`]*limit=50/)
  })
})