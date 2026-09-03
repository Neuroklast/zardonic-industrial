import { describe, expect, it } from 'vitest'
import { browseReleases } from '@/lib/release-browse'

describe('release browse helpers', () => {
  const releases = [
    { id: '1', title: 'Alpha Album', type: 'album', release_date: '2024-01-01' },
    { id: '2', title: 'Beta EP', type: 'ep', release_date: '2025-06-01' },
    { id: '3', title: 'Gamma Single', type: 'single', release_date: '2023-03-01' },
  ]

  it('sorts, filters by type, and searches by title', () => {
    const filtered = browseReleases(releases, { typeFilter: 'single-ep' })
    expect(filtered).toHaveLength(2)
    expect(filtered.map((release) => release.title).sort()).toEqual(['Beta EP', 'Gamma Single'])

    const searched = browseReleases(releases, { query: 'alpha' })
    expect(searched).toHaveLength(1)
    expect(searched[0]?.id).toBe('1')

    const sorted = browseReleases(releases)
    expect(sorted.map((release) => release.id)).toEqual(['2', '1', '3'])
  })
})