import { describe, expect, it } from 'vitest'
import {
  classifyReleaseType,
  displayReleaseType,
  toQuickSelectReleaseType,
  trustworthyDeclaredType,
} from '@/lib/release-type'
import { inferReleaseTypeFromTitle } from '@/lib/release-metadata'

describe('displayReleaseType', () => {
  it('groups single and ep under one label', () => {
    expect(displayReleaseType('single')).toBe('Single / EP')
    expect(displayReleaseType('ep')).toBe('Single / EP')
  })

  it('maps the remaining stored values', () => {
    expect(displayReleaseType('album')).toBe('Album')
    expect(displayReleaseType('remix')).toBe('Remix')
    expect(displayReleaseType('compilation')).toBe('Compilation')
  })
})

describe('toQuickSelectReleaseType', () => {
  it('folds single and ep into one bucket', () => {
    expect(toQuickSelectReleaseType('single')).toBe('single')
    expect(toQuickSelectReleaseType('ep')).toBe('single')
  })

  it('maps the other stored values', () => {
    expect(toQuickSelectReleaseType('remix')).toBe('remix')
    expect(toQuickSelectReleaseType('album')).toBe('album')
    expect(toQuickSelectReleaseType('compilation')).toBe('compilation')
  })

  it('returns null for empty or unknown values', () => {
    expect(toQuickSelectReleaseType('')).toBeNull()
    expect(toQuickSelectReleaseType(null)).toBeNull()
    expect(toQuickSelectReleaseType(undefined)).toBeNull()
    expect(toQuickSelectReleaseType('bogus')).toBeNull()
  })
})

describe('trustworthyDeclaredType', () => {
  it('rejects Apple\'s always-"Album" collectionType', () => {
    expect(trustworthyDeclaredType('Album')).toBeNull()
    expect(trustworthyDeclaredType('album')).toBeNull()
    expect(trustworthyDeclaredType(undefined)).toBeNull()
  })

  it('keeps specific values', () => {
    expect(trustworthyDeclaredType('Single')).toBe('Single')
    expect(trustworthyDeclaredType('EP')).toBe('EP')
    expect(trustworthyDeclaredType('Compilation')).toBe('Compilation')
  })
})

describe('classifyReleaseType — semantic title markers win', () => {
  it('treats a remix title as remix even when Apple says Single', () => {
    expect(classifyReleaseType({ title: 'Higher (Zardonic Remix) - Single', trackCount: 1 })).toBe(
      'remix',
    )
  })

  it('detects remix collections with many tracks', () => {
    expect(classifyReleaseType({ title: 'The Become Remix Album', trackCount: 14 })).toBe('remix')
    expect(classifyReleaseType({ title: 'Restless (Remixes) - EP', trackCount: 6 })).toBe('remix')
  })

  it('detects the RMX abbreviation', () => {
    expect(classifyReleaseType({ title: 'Kernel Breaker RMX' })).toBe('remix')
  })

  it('detects compilations by title', () => {
    expect(classifyReleaseType({ title: 'Best Of Zardonic', trackCount: 20 })).toBe('compilation')
    expect(classifyReleaseType({ title: 'Greatest Hits' })).toBe('compilation')
    expect(classifyReleaseType({ title: 'B-Sides Compilation' })).toBe('compilation')
  })
})

describe('classifyReleaseType — declared type and Apple suffix', () => {
  it('uses a trustworthy declared type', () => {
    expect(classifyReleaseType({ title: 'Whatever', declaredType: 'Compilation' })).toBe(
      'compilation',
    )
    expect(classifyReleaseType({ title: 'Whatever', declaredType: 'EP' })).toBe('ep')
    expect(classifyReleaseType({ title: 'Whatever', declaredType: 'Album' })).toBe('album')
  })

  it('reads Apple trailing suffixes', () => {
    expect(classifyReleaseType({ title: 'Bitter (feat. Reebz) - Single', trackCount: 1 })).toBe(
      'single',
    )
    expect(classifyReleaseType({ title: 'Phoenix Down - EP', trackCount: 5 })).toBe('ep')
    expect(classifyReleaseType({ title: 'Foo - Compilation', trackCount: 30 })).toBe('compilation')
  })

  it('reads parenthetical markers', () => {
    expect(classifyReleaseType({ title: 'Foo (EP)', trackCount: 8 })).toBe('ep')
  })
})

describe('classifyReleaseType — track counts', () => {
  it('classifies by track count when nothing else applies', () => {
    expect(classifyReleaseType({ title: 'Superstars', trackCount: 12 })).toBe('album')
    expect(classifyReleaseType({ title: 'One Track', trackCount: 1 })).toBe('single')
    expect(classifyReleaseType({ title: 'Short Player', trackCount: 5 })).toBe('ep')
  })

  it('treats a bare EP token as explicit', () => {
    expect(classifyReleaseType({ title: 'Deep EP', trackCount: 9 })).toBe('ep')
  })
})

describe('classifyReleaseType — word boundaries', () => {
  it('does not treat "The Epic" as an EP', () => {
    expect(classifyReleaseType({ title: 'The Epic', trackCount: 11 })).toBe('album')
  })

  it('does not treat "Deep Space" as an EP', () => {
    expect(classifyReleaseType({ title: 'Deep Space', trackCount: 9 })).toBe('album')
  })

  it('does not let a bare "Single" token beat a real track count', () => {
    expect(classifyReleaseType({ title: 'Single Ladies', trackCount: 10 })).toBe('album')
    expect(classifyReleaseType({ title: 'Singles Collection', trackCount: null })).toBe('single')
  })
})

describe('classifyReleaseType — Spotify semantics', () => {
  it('splits Spotify singles from EPs via track count', () => {
    expect(classifyReleaseType({ title: 'Some Track', declaredType: null, trackCount: 1 })).toBe(
      'single',
    )
    expect(classifyReleaseType({ title: 'Some EP', declaredType: null, trackCount: 5 })).toBe('ep')
  })

  it('falls back to album when nothing is known', () => {
    expect(classifyReleaseType({ title: '' })).toBe('album')
    expect(classifyReleaseType({ title: 'Mystery' })).toBe('album')
  })
})

describe('inferReleaseTypeFromTitle (deprecated wrapper)', () => {
  it('delegates to the canonical classifier', () => {
    expect(inferReleaseTypeFromTitle('Foo - EP')).toBe('ep')
    expect(inferReleaseTypeFromTitle('Zardonic Remix')).toBe('remix')
    expect(inferReleaseTypeFromTitle('Plain Album', ['Compilation'])).toBe('compilation')
  })
})
