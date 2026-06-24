import { describe, expect, it } from 'vitest'
import {
  hasComplementaryExternalIds,
  normalizeReleaseTitleKey,
  releaseTitleKeysMatch,
  sharedStreamingFingerprint,
} from '@/lib/release-title-match'
import { releasesAreDuplicates } from '@/lib/release-consolidation'
import type { ReleaseConsolidationRow } from '@/lib/release-consolidation'

function row(overrides: Partial<ReleaseConsolidationRow> & { id: string; title: string }): ReleaseConsolidationRow {
  return {
    type: 'album',
    release_date: '2018-06-01',
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
  it('strips artist prefixes and edition suffixes', () => {
    expect(normalizeReleaseTitleKey('Zardonic - Revolution')).toBe('revolution')
    expect(normalizeReleaseTitleKey('Revolution (Deluxe Edition)')).toBe('revolution')
    expect(normalizeReleaseTitleKey('The Takeover - EP')).toBe('takeover')
  })

  it('strips feat clauses', () => {
    expect(normalizeReleaseTitleKey('Bad Company feat. Someone')).toBe('bad company')
  })
})

describe('releaseTitleKeysMatch', () => {
  it('matches the and prefix variants', () => {
    expect(releaseTitleKeysMatch('takeover', 'the takeover')).toBe(true)
    expect(releaseTitleKeysMatch('revolution', 'zardonic revolution')).toBe(true)
  })
})

describe('sharedStreamingFingerprint', () => {
  it('matches rows that share a spotify link in streaming_links', () => {
    const a = row({
      id: '1',
      title: 'Different Title A',
      streaming_links: [{ platform: 'spotify', url: 'https://open.spotify.com/album/7BqEidErPMNiUXCRE0dV2n' }],
    })
    const b = row({
      id: '2',
      title: 'Different Title B',
      spotify_id: '7BqEidErPMNiUXCRE0dV2n',
    })
    expect(sharedStreamingFingerprint(a, b)).toBe('spotify:7BqEidErPMNiUXCRE0dV2n')
    expect(releasesAreDuplicates(a, b)).toBe(true)
  })
})

describe('hasComplementaryExternalIds', () => {
  it('detects iTunes-only vs Spotify-only rows', () => {
    const a = row({ id: '1', title: 'A', itunes_id: '111' })
    const b = row({ id: '2', title: 'B', spotify_id: '222' })
    expect(hasComplementaryExternalIds(a, b)).toBe(true)
  })
})

describe('releasesAreDuplicates cross-source', () => {
  it('merges complementary platform ids with fuzzy titles', () => {
    const a = row({
      id: '1',
      title: 'Zardonic - Revolution',
      release_date: '2015-01-01',
      itunes_id: '100',
    })
    const b = row({
      id: '2',
      title: 'Revolution',
      release_date: '2015-06-01',
      spotify_id: '200',
    })
    expect(releasesAreDuplicates(a, b, { artistNames: ['Zardonic'] })).toBe(true)
  })
})