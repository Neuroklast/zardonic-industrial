import { describe, expect, it } from 'vitest'
import {
  chunkPartnerRows,
  detectListDelimiter,
  markDuplicateRows,
  nameFromFileName,
  normalizePartnerCategory,
  normalizePartnerKey,
  parsePartnerListText,
  toPartnerBulkPayload,
  type PartnerBulkInput,
} from '@/lib/partner-bulk-import'

function makeRow(overrides: Partial<PartnerBulkInput> = {}): PartnerBulkInput {
  return {
    name: 'Questec',
    url: null,
    category: 'partner',
    displayOrder: 0,
    logoWhite: true,
    logoStoragePath: null,
    logoUrl: null,
    ...overrides,
  }
}

describe('nameFromFileName', () => {
  it('strips the extension and turns separators into spaces', () => {
    expect(nameFromFileName('questec-logo_final.png')).toBe('questec logo final')
    expect(nameFromFileName('Native Instruments.webp')).toBe('Native Instruments')
    expect(nameFromFileName('a.b.c.svg')).toBe('a b c')
  })

  it('collapses whitespace and trims', () => {
    expect(nameFromFileName('  Foo__Bar  .png')).toBe('Foo Bar')
  })
})

describe('normalizePartnerCategory', () => {
  it('maps aliases and defaults to partner', () => {
    expect(normalizePartnerCategory('Credits')).toBe('credit')
    expect(normalizePartnerCategory('friend')).toBe('partner')
    expect(normalizePartnerCategory('LABELS')).toBe('label')
    expect(normalizePartnerCategory('sponsor')).toBe('sponsor')
  })

  it('falls back to partner for empty or unknown values', () => {
    expect(normalizePartnerCategory('')).toBe('partner')
    expect(normalizePartnerCategory(null)).toBe('partner')
    expect(normalizePartnerCategory('nonsense')).toBe('partner')
  })
})

describe('normalizePartnerKey', () => {
  it('is case- and whitespace-insensitive', () => {
    expect(normalizePartnerKey('  Questec ', 'Credit')).toBe(normalizePartnerKey('questec', 'credit'))
  })

  it('separates categories', () => {
    expect(normalizePartnerKey('Questec', 'credit')).not.toBe(normalizePartnerKey('Questec', 'partner'))
  })
})

describe('detectListDelimiter', () => {
  it('detects tabs, pipes and commas', () => {
    expect(detectListDelimiter('A\tB\tC')).toBe('\t')
    expect(detectListDelimiter('A | B | C')).toBe('|')
    expect(detectListDelimiter('A,B,C')).toBe(',')
  })

  it('defaults to tab when there is only a name column', () => {
    expect(detectListDelimiter('JustAName')).toBe('\t')
  })
})

describe('parsePartnerListText', () => {
  it('parses a tab separated list with url, logo url, category and order', () => {
    const result = parsePartnerListText(
      'Questec\thttps://questec.com\thttps://cdn.example/q.png\tcredit\t3',
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      name: 'Questec',
      url: 'https://questec.com',
      logoUrl: 'https://cdn.example/q.png',
      category: 'credit',
      displayOrder: 3,
      logoWhite: true,
    })
  })

  it('parses a pipe separated list and skips comments and blank lines', () => {
    const text = ['# credits', '', 'Ableton | https://ableton.com', 'Native Instruments | https://ni.com'].join('\n')
    const result = parsePartnerListText(text)
    expect(result.rows.map((row) => row.name)).toEqual(['Ableton', 'Native Instruments'])
    expect(result.delimiter).toBe('|')
  })

  it('detects and drops a header row', () => {
    const result = parsePartnerListText('Name | URL | Logo URL | Section | Order\nAbleton | https://ableton.com')
    expect(result.headerDetected).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe('Ableton')
  })

  it('supports quoted fields containing the delimiter', () => {
    const result = parsePartnerListText('"Foo, Inc" | https://foo.example')
    expect(result.rows[0]).toMatchObject({ name: 'Foo, Inc', url: 'https://foo.example' })
  })

  it('collects a per-line error when the name is missing', () => {
    const result = parsePartnerListText('Ableton | https://ableton.com\n | https://missing.example')
    expect(result.errors).toEqual([{ line: 2, message: 'Missing name' }])
    expect(result.rows).toHaveLength(1)
  })

  it('defaults category to partner and order to 0', () => {
    const result = parsePartnerListText('Ableton | https://ableton.com')
    expect(result.rows[0].category).toBe('partner')
    expect(result.rows[0].displayOrder).toBe(0)
  })
})

describe('markDuplicateRows', () => {
  it('flags rows already present in the database', () => {
    const flags = markDuplicateRows([makeRow({ name: 'Questec' })], [{ name: 'questec', category: 'partner' }])
    expect(flags).toEqual([true])
  })

  it('flags repeated rows within the same batch after the first', () => {
    const flags = markDuplicateRows(
      [makeRow({ name: 'A' }), makeRow({ name: 'a' }), makeRow({ name: 'B' })],
      [],
    )
    expect(flags).toEqual([false, true, false])
  })

  it('keeps rows that share a name but differ in category', () => {
    const flags = markDuplicateRows(
      [makeRow({ name: 'Questec', category: 'credit' }), makeRow({ name: 'Questec', category: 'partner' })],
      [],
    )
    expect(flags).toEqual([false, false])
  })
})

describe('toPartnerBulkPayload', () => {
  it('maps camelCase drafts to snake_case columns and nulls empties', () => {
    const payload = toPartnerBulkPayload(
      makeRow({
        name: '  Questec  ',
        url: '',
        logoStoragePath: 'partners/logos/abc.webp',
        logoUrl: '',
        displayOrder: 2.9,
      }),
    )
    expect(payload).toEqual({
      name: 'Questec',
      url: null,
      logo_storage_path: 'partners/logos/abc.webp',
      logo_url: null,
      category: 'partner',
      display_order: 2,
      logo_white: true,
    })
  })
})

describe('chunkPartnerRows', () => {
  it('splits into fixed size chunks', () => {
    expect(chunkPartnerRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns an empty array for no rows', () => {
    expect(chunkPartnerRows([], 2)).toEqual([])
  })

  it('keeps everything in one chunk for non-positive sizes', () => {
    expect(chunkPartnerRows([1, 2, 3], 0)).toEqual([[1, 2, 3]])
  })
})
