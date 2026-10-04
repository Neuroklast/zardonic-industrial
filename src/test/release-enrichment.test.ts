import { describe, it, expect } from 'vitest'
import {
  releaseNeedsEnrichment,
  releaseNeedsTrackEnrichment,
  releaseTracksAreEmpty,
  type ReleaseEnrichmentRow,
} from '@/lib/release-enrichment'

function row(overrides: Partial<ReleaseEnrichmentRow> = {}): ReleaseEnrichmentRow {
  return {
    id: '1',
    title: 'Test',
    tracks: [],
    manually_edited: false,
    spotify_id: 'abc123',
    discogs_id: null,
    itunes_id: null,
    tracks_source: null,
    last_enriched_at: null,
    ...overrides,
  }
}

describe('release-enrichment', () => {
  it('detects empty tracklists', () => {
    expect(releaseTracksAreEmpty([])).toBe(true)
    expect(releaseTracksAreEmpty(null)).toBe(true)
    expect(releaseTracksAreEmpty([{ title: 'A' }])).toBe(false)
  })

  it('skips manually edited releases', () => {
    expect(releaseNeedsTrackEnrichment(row({ manually_edited: true }))).toBe(false)
  })

  it('enriches when tracks are empty and an external id exists', () => {
    expect(releaseNeedsTrackEnrichment(row())).toBe(true)
  })

  it('skips when no external id is available', () => {
    expect(releaseNeedsTrackEnrichment(row({ spotify_id: null }))).toBe(false)
  })

  it('force mode bypasses filled tracklists', () => {
    const filled = row({
      tracks: [{ title: 'Track 1' }],
      last_enriched_at: new Date().toISOString(),
    })
    expect(releaseNeedsTrackEnrichment(filled)).toBe(false)
    expect(releaseNeedsTrackEnrichment(filled, { force: true })).toBe(true)
  })

  it('does not flag a release with tracks + external id as needing enrichment', () => {
    const fresh = row({
      tracks: [{ title: 'Track 1' }],
      last_enriched_at: new Date().toISOString(),
    })
    expect(releaseNeedsEnrichment(fresh)).toBe(false)
  })
})
