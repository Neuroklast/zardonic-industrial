import { describe, expect, it } from 'vitest'
import {
  groupChangesByType,
  planReleaseTypeChange,
  type ReclassifyReleaseRow,
} from '@/lib/release-type-reclassify'

function row(overrides: Partial<ReclassifyReleaseRow>): ReclassifyReleaseRow {
  return {
    id: 'r1',
    title: 'Untitled',
    type: 'album',
    tracks: [],
    manually_edited: false,
    ...overrides,
  }
}

describe('planReleaseTypeChange', () => {
  it('skips manually edited releases', () => {
    expect(
      planReleaseTypeChange(row({ title: 'Foo - EP', manually_edited: true })),
    ).toBeNull()
  })

  it('leaves titles without an explicit signal untouched', () => {
    expect(planReleaseTypeChange(row({ title: 'Mystery', type: 'album' }))).toBeNull()
  })

  it('does not rewrite when the computed type already matches', () => {
    expect(planReleaseTypeChange(row({ title: 'Foo - EP', type: 'ep' }))).toBeNull()
  })

  it('corrects a release from its Apple suffix', () => {
    const change = planReleaseTypeChange(row({ title: 'Foo - EP', type: 'album' }))
    expect(change?.to).toBe('ep')
    expect(change?.from).toBe('album')
  })

  it('corrects a release from a remix title marker', () => {
    const change = planReleaseTypeChange(row({ title: 'The Become Remix Album', type: 'album' }))
    expect(change?.to).toBe('remix')
  })

  it('uses the stored track count as a signal', () => {
    const change = planReleaseTypeChange(
      row({
        title: 'Superstars',
        type: 'single',
        tracks: Array.from({ length: 12 }, (_, i) => ({ title: `Track ${i + 1}` })),
      }),
    )
    expect(change?.to).toBe('album')
    expect(change?.trackCount).toBe(12)
  })
})

describe('groupChangesByType', () => {
  it('buckets ids by their target type', () => {
    const groups = groupChangesByType([
      { id: 'a', title: 'A', from: 'album', to: 'single', trackCount: 1 },
      { id: 'b', title: 'B', from: 'album', to: 'single', trackCount: 1 },
      { id: 'c', title: 'C', from: 'album', to: 'ep', trackCount: 4 },
    ])
    expect(groups.single).toEqual(['a', 'b'])
    expect(groups.ep).toEqual(['c'])
    expect(groups.album).toBeUndefined()
  })

  it('returns an empty object when there are no changes', () => {
    expect(groupChangesByType([])).toEqual({})
  })
})
