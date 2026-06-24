import { describe, expect, it } from 'vitest'
import {
  buildConsolidatedReleaseUpdate,
  dedupeCatalogueImportItems,
  findExistingReleaseForImport,
  findManualMergeRejectionReason,
  groupDuplicateReleases,
  normalizeReleaseTitleKey,
  releasesAreDuplicates,
  scoreReleaseForCanonical,
  buildReleaseMatchIndex,
} from '@/lib/release-consolidation'
import type { ReleaseConsolidationRow } from '@/lib/release-consolidation'

function row(overrides: Partial<ReleaseConsolidationRow> & { id: string; title: string }): ReleaseConsolidationRow {
  return {
    type: 'album',
    release_date: '2020-06-01',
    description: null,
    artists: null,
    streaming_links: [],
    tracks: [],
    tracks_source: null,
    last_enriched_at: null,
    cover_storage_path: null,
    cover_url: null,
    display_order: 0,
    active: true,
    manually_edited: false,
    itunes_id: null,
    spotify_id: null,
    discogs_id: null,
    ...overrides,
  }
}

describe('normalizeReleaseTitleKey', () => {
  it('strips deluxe suffixes and parentheticals', () => {
    expect(normalizeReleaseTitleKey('Villain (Deluxe Edition)')).toBe('villain')
    expect(normalizeReleaseTitleKey('Villain - EP')).toBe('villain')
    expect(normalizeReleaseTitleKey('Zardonic - Villain', { artistNames: ['Zardonic'] })).toBe('villain')
  })
})

describe('releasesAreDuplicates', () => {
  it('matches same spotify id', () => {
    const a = row({ id: '1', title: 'A', spotify_id: 'abc' })
    const b = row({ id: '2', title: 'B', spotify_id: 'abc' })
    expect(releasesAreDuplicates(a, b)).toBe(true)
  })

  it('matches normalized title and release date across sources', () => {
    const a = row({ id: '1', title: 'Revolution', release_date: '2015-03-20', itunes_id: '1' })
    const b = row({
      id: '2',
      title: 'Revolution (Deluxe Edition)',
      release_date: '2015-03-20',
      spotify_id: '2',
    })
    expect(releasesAreDuplicates(a, b)).toBe(true)
  })

  it('does not merge different releases with same title but different years', () => {
    const a = row({ id: '1', title: 'Revolution', release_date: '2015-03-20' })
    const b = row({ id: '2', title: 'Revolution', release_date: '2020-03-20' })
    expect(releasesAreDuplicates(a, b)).toBe(false)
  })

  it('merges Mars / Going Under / Kernel Breaker cross-source singles', () => {
    const opts = { artistNames: ['Zardonic'] }

    const marsSpotify = row({
      id: 'mars-sp',
      title: 'Mars (Zardonic Remix)',
      type: 'single',
      release_date: '2026-06-19',
      spotify_id: 'mars-spotify',
      streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/mars1' }],
    })
    const marsItunes = row({
      id: 'mars-it',
      title: 'Mars (Zardonic Remix) - Single',
      type: 'single',
      release_date: '2026-06-19',
      itunes_id: 'mars-itunes',
      streaming_links: [
        { platform: 'appleMusic', url: 'https://music.apple.com/album/mars1' },
        { platform: 'pandora', url: 'https://www.pandora.com/mars1' },
      ],
    })
    expect(releasesAreDuplicates(marsSpotify, marsItunes, opts)).toBe(true)

    const kernelSpotify = row({
      id: 'kb-sp',
      title: 'Kernel Breaker (Remix)',
      type: 'single',
      release_date: '2026-03-27',
      spotify_id: 'kb-spotify',
    })
    const kernelItunes = row({
      id: 'kb-it',
      title: 'Kernel Breaker (feat. Noisesmith, Roel Peijs & Kylee Brielle) [Remix] - Single',
      type: 'single',
      release_date: '2026-03-27',
      itunes_id: 'kb-itunes',
      streaming_links: [{ platform: 'appleMusic', url: 'https://music.apple.com/album/kb1' }],
    })
    expect(releasesAreDuplicates(kernelSpotify, kernelItunes, opts)).toBe(true)

    const goingSpotify = row({
      id: 'gu-sp',
      title: 'Going Under (Zardonic Remix)',
      type: 'single',
      release_date: '2026-03-01',
      spotify_id: 'gu-spotify',
      streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/gu1' }],
    })
    const goingItunes = row({
      id: 'gu-it',
      title: 'Going Under (Zardonic Remix) - Single',
      type: 'single',
      release_date: '2026-03-01',
      itunes_id: 'gu-itunes',
      tracks: [{ title: 'Going Under (Zardonic Remix)' }, { title: 'Going Under' }],
      streaming_links: [
        { platform: 'appleMusic', url: 'https://music.apple.com/album/gu1' },
        { platform: 'boomplay', url: 'https://www.boomplay.com/gu1' },
      ],
    })
    expect(releasesAreDuplicates(goingSpotify, goingItunes, opts)).toBe(true)
  })

  it('merges fuzzy titles with complementary links even when release dates differ', () => {
    const a = row({
      id: '1',
      title: 'Going Under (Zardonic Remix)',
      type: 'single',
      release_date: '2025-12-01',
      streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/7BqEidErPMNiUXCRE0dV2n' }],
    })
    const b = row({
      id: '2',
      title: 'Going Under (Zardonic Remix) - Single',
      type: 'single',
      release_date: '2026-03-01',
      streaming_links: [{ platform: 'appleMusic', url: 'https://music.apple.com/us/album/x/1440000000' }],
    })
    expect(releasesAreDuplicates(a, b, { artistNames: ['Zardonic'] })).toBe(true)
  })

  it('merges rows that only have platform ids inside streaming_links', () => {
    const a = row({
      id: '1',
      title: 'Going Under (Zardonic Remix)',
      type: 'single',
      release_date: '2026-03-01',
      streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/7BqEidErPMNiUXCRE0dV2n' }],
    })
    const b = row({
      id: '2',
      title: 'Going Under (Zardonic Remix) - Single',
      type: 'single',
      release_date: '2026-03-01',
      streaming_links: [{ platform: 'appleMusic', url: 'https://music.apple.com/us/album/x/1440000000' }],
    })
    expect(releasesAreDuplicates(a, b, { artistNames: ['Zardonic'] })).toBe(true)
  })

  it('merges iTunes single with Spotify album listing for the same title', () => {
    const a = row({
      id: '1',
      title: 'Revolution',
      type: 'single',
      release_date: '2015-03-20',
      itunes_id: '111',
    })
    const b = row({
      id: '2',
      title: 'Revolution',
      type: 'album',
      release_date: '2015-03-20',
      spotify_id: '222',
    })
    expect(releasesAreDuplicates(a, b)).toBe(true)
  })
})

describe('findExistingReleaseForImport', () => {
  it('finds an existing row by fuzzy title when external id is new', () => {
    const existing = row({
      id: 'keep-me',
      title: 'Supervillain Origins',
      release_date: '2018-01-01',
      itunes_id: '123',
    })
    const index = buildReleaseMatchIndex([existing])

    const hit = findExistingReleaseForImport(
      {
        title: 'Supervillain Origins (Expanded Edition)',
        type: 'album',
        release_date: '2018-01-01',
        description: null,
        artists: [],
        coverUrl: null,
        streaming_links: [],
        spotify_id: 'spotify-new',
      },
      index,
    )

    expect(hit?.id).toBe('keep-me')
  })
})

describe('dedupeCatalogueImportItems', () => {
  it('fuzzy-dedupes artist-prefixed titles', () => {
    const deduped = dedupeCatalogueImportItems(
      [
        {
          externalId: 'itunes-1',
          metadata: {
            title: 'Zardonic - Revolution',
            type: 'album',
            release_date: '2015-01-01',
            description: null,
            artists: [],
            coverUrl: null,
            streaming_links: [],
            itunes_id: '1',
          },
        },
        {
          externalId: 'spotify-1',
          metadata: {
            title: 'Revolution (Remastered)',
            type: 'album',
            release_date: '2015-01-01',
            description: null,
            artists: [],
            coverUrl: null,
            streaming_links: [],
            spotify_id: '2',
            tracks: [{ title: 'Track 1' }],
          },
        },
      ],
      { artistNames: ['Zardonic'] },
    )

    expect(deduped).toHaveLength(1)
    expect(deduped[0].externalId).toBe('spotify-1')
  })

  it('keeps the richest staged item for the same title', () => {
    const deduped = dedupeCatalogueImportItems([
      {
        externalId: 'a',
        metadata: {
          title: 'Same Album',
          type: 'album',
          release_date: '2020-01-01',
          description: null,
          artists: [],
          coverUrl: null,
          streaming_links: [],
        },
      },
      {
        externalId: 'b',
        metadata: {
          title: 'Same Album (Deluxe Edition)',
          type: 'album',
          release_date: '2020-01-01',
          description: null,
          artists: [],
          coverUrl: 'https://example.com/cover.jpg',
          streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/b' }],
          tracks: [{ title: 'Track 1' }],
          spotify_id: 'b',
        },
      },
    ])

    expect(deduped).toHaveLength(1)
    expect(deduped[0].externalId).toBe('b')
  })
})

describe('groupDuplicateReleases', () => {
  it('groups duplicates and prefers manually edited canonical rows', () => {
    const groups = groupDuplicateReleases([
      row({ id: '1', title: 'Album', spotify_id: 's1' }),
      row({ id: '2', title: 'Album (Remastered)', spotify_id: 's2', manually_edited: true }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(2)
    expect(scoreReleaseForCanonical(groups[0][1])).toBeGreaterThan(scoreReleaseForCanonical(groups[0][0]))
  })

  it('skips groups where both rows are manually edited', () => {
    const groups = groupDuplicateReleases([
      row({ id: '1', title: 'Album', manually_edited: true }),
      row({ id: '2', title: 'Album', manually_edited: true }),
    ])
    expect(groups).toHaveLength(0)
  })
})

describe('findManualMergeRejectionReason', () => {
  it('allows cross-source duplicates to be merged manually', () => {
    const a = row({
      id: '1',
      title: 'Going Under (Zardonic Remix)',
      type: 'single',
      release_date: '2026-03-01',
      spotify_id: 'sp1',
    })
    const b = row({
      id: '2',
      title: 'Going Under (Zardonic Remix) - Single',
      type: 'single',
      release_date: '2026-03-01',
      itunes_id: 'it1',
    })
    expect(findManualMergeRejectionReason([a, b], { artistNames: ['Zardonic'] })).toBeNull()
  })

  it('rejects unrelated releases with the same base title but different years', () => {
    const a = row({ id: '1', title: 'Revolution', release_date: '2015-03-20' })
    const b = row({ id: '2', title: 'Revolution', release_date: '2020-03-20' })
    expect(findManualMergeRejectionReason([a, b])).toMatch(/do not appear/i)
  })

  it('rejects conflicting spotify album ids', () => {
    const a = row({
      id: '1',
      title: 'Same Name',
      release_date: '2020-01-01',
      spotify_id: 'aaa',
    })
    const b = row({
      id: '2',
      title: 'Same Name (Remix)',
      release_date: '2020-01-01',
      spotify_id: 'bbb',
    })
    expect(findManualMergeRejectionReason([a, b])).toMatch(/Conflicting Spotify/i)
  })

  it('rejects selections where only some releases are related', () => {
    const mars = row({
      id: '1',
      title: 'Mars (Zardonic Remix)',
      type: 'single',
      release_date: '2026-06-19',
      spotify_id: 'sp1',
    })
    const marsItunes = row({
      id: '2',
      title: 'Mars (Zardonic Remix) - Single',
      type: 'single',
      release_date: '2026-06-19',
      itunes_id: 'it1',
    })
    const unrelated = row({
      id: '3',
      title: 'Totally Different Album',
      type: 'album',
      release_date: '2010-01-01',
    })
    expect(
      findManualMergeRejectionReason([mars, marsItunes, unrelated], { artistNames: ['Zardonic'] }),
    ).toMatch(/not all related/i)
  })
})

describe('buildConsolidatedReleaseUpdate', () => {
  it('fills missing external ids and tracks from duplicate', () => {
    const canonical = row({ id: '1', title: 'Album', itunes_id: '123', tracks: [] })
    const duplicate = row({
      id: '2',
      title: 'Album',
      spotify_id: 'spotify-1',
      tracks: [{ title: 'Intro' } as unknown as never],
      tracks_source: 'spotify',
    })

    const { update } = buildConsolidatedReleaseUpdate(canonical, duplicate)
    expect(update).toMatchObject({
      spotify_id: 'spotify-1',
      tracks: [{ title: 'Intro' }],
      tracks_source: 'spotify',
    })
  })

  it('replaces Spotify canonical cover with iTunes duplicate cover', () => {
    const canonical = row({
      id: '1',
      title: 'Mars (Zardonic Remix)',
      cover_storage_path: 'releases/spotify-mars',
      cover_url: 'https://i.scdn.co/image/mars',
    })
    const duplicate = row({
      id: '2',
      title: 'Mars (Zardonic Remix) - Single',
      cover_storage_path: 'releases/itunes-mars',
      cover_url: 'https://is1-ssl.mzstatic.com/mars.jpg',
      itunes_id: '999',
    })

    const { update, coverPathsToDiscard } = buildConsolidatedReleaseUpdate(canonical, duplicate)
    expect(update).toMatchObject({
      cover_storage_path: 'releases/itunes-mars',
      cover_url: 'https://is1-ssl.mzstatic.com/mars.jpg',
      itunes_id: '999',
    })
    expect(coverPathsToDiscard).toContain('releases/spotify-mars')
    expect(coverPathsToDiscard).not.toContain('releases/itunes-mars')
  })
})