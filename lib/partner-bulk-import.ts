export const PARTNER_CATEGORIES = ['credit', 'endorsement', 'partner', 'label', 'sponsor'] as const
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number]

export const DEFAULT_PARTNER_CATEGORY: PartnerCategory = 'partner'

export const PARTNER_BULK_MAX_ROWS = 200
export const PARTNER_BULK_INSERT_CHUNK = 50
export const PARTNER_BULK_UPLOAD_CONCURRENCY = 3

const CATEGORY_ALIASES: Record<string, PartnerCategory> = {
  credit: 'credit',
  credits: 'credit',
  endorsement: 'endorsement',
  endorsements: 'endorsement',
  partner: 'partner',
  partners: 'partner',
  friend: 'partner',
  friends: 'partner',
  label: 'label',
  labels: 'label',
  sponsor: 'sponsor',
  sponsors: 'sponsor',
}

export interface PartnerBulkInput {
  name: string
  url: string | null
  category: PartnerCategory
  displayOrder: number
  logoWhite: boolean
  logoStoragePath: string | null
  logoUrl: string | null
}

export interface PartnerBulkPayload {
  name: string
  url: string | null
  logo_storage_path: string | null
  logo_url: string | null
  category: PartnerCategory
  display_order: number
  logo_white: boolean
}

export interface PartnerKeyLike {
  name: string
  category: string
}

export interface PartnerListRowError {
  line: number
  message: string
}

export type PartnerListDelimiter = '\t' | '|' | ','

export interface PartnerListParseResult {
  rows: PartnerBulkInput[]
  errors: PartnerListRowError[]
  delimiter: PartnerListDelimiter
  headerDetected: boolean
}

const DELIMITER_CANDIDATES: PartnerListDelimiter[] = ['\t', '|', ',']

const HEADER_NAME_TOKENS = new Set(['name', 'partner', 'credit', 'title'])
const HEADER_HINT_PATTERN = /url|category|section|logo|order|type/i

function emptyToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && char === delimiter) {
      fields.push(current)
      current = ''
      continue
    }
    current += char
  }

  fields.push(current)
  return fields.map((field) => field.trim())
}

function listContentLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))
}

export function detectListDelimiter(text: string): PartnerListDelimiter {
  const lines = listContentLines(text)
  let best: PartnerListDelimiter = '\t'
  let bestCount = 0

  for (const delimiter of DELIMITER_CANDIDATES) {
    const count = lines.reduce(
      (total, line) => total + (splitDelimitedLine(line, delimiter).length - 1),
      0,
    )
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }

  return best
}

export function nameFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[a-z0-9]+$/i, '')
  return withoutExtension.replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizePartnerName(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizePartnerCategory(value: string | null | undefined): PartnerCategory {
  if (!value) return DEFAULT_PARTNER_CATEGORY
  const key = value.trim().toLowerCase()
  return CATEGORY_ALIASES[key] ?? DEFAULT_PARTNER_CATEGORY
}

export function normalizePartnerKey(name: string, category: string): string {
  return `${normalizePartnerCategory(category)}::${normalizePartnerName(name).toLowerCase()}`
}

function parseDisplayOrder(value: string | null | undefined): number {
  const parsed = Number(emptyToNull(value) ?? 0)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}

function isHeaderRow(fields: string[]): boolean {
  const first = (fields[0] ?? '').trim().toLowerCase()
  if (!HEADER_NAME_TOKENS.has(first)) return false
  return fields.slice(1).some((field) => HEADER_HINT_PATTERN.test(field))
}

export function parsePartnerListText(text: string): PartnerListParseResult {
  const delimiter = detectListDelimiter(text)
  const rows: PartnerBulkInput[] = []
  const errors: PartnerListRowError[] = []
  let headerDetected = false
  let seenContent = false

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1
    const trimmed = rawLine.trim()
    if (trimmed === '' || trimmed.startsWith('#')) return

    const fields = splitDelimitedLine(rawLine, delimiter)

    if (!seenContent) {
      seenContent = true
      if (isHeaderRow(fields)) {
        headerDetected = true
        return
      }
    }

    const name = normalizePartnerName(fields[0] ?? '')
    if (!name) {
      errors.push({ line: lineNumber, message: 'Missing name' })
      return
    }

    rows.push({
      name,
      url: emptyToNull(fields[1]),
      logoUrl: emptyToNull(fields[2]),
      category: normalizePartnerCategory(fields[3]),
      displayOrder: parseDisplayOrder(fields[4]),
      logoWhite: true,
      logoStoragePath: null,
    })
  })

  return { rows, errors, delimiter, headerDetected }
}

export function markDuplicateRows(
  rows: readonly PartnerKeyLike[],
  existing: readonly PartnerKeyLike[],
): boolean[] {
  const seen = new Set(existing.map((row) => normalizePartnerKey(row.name, row.category)))

  return rows.map((row) => {
    const key = normalizePartnerKey(row.name, row.category)
    if (seen.has(key)) return true
    seen.add(key)
    return false
  })
}

export function toPartnerBulkPayload(row: PartnerBulkInput): PartnerBulkPayload {
  return {
    name: normalizePartnerName(row.name),
    url: emptyToNull(row.url),
    logo_storage_path: emptyToNull(row.logoStoragePath),
    logo_url: emptyToNull(row.logoUrl),
    category: normalizePartnerCategory(row.category),
    display_order: Number.isFinite(row.displayOrder) ? Math.trunc(row.displayOrder) : 0,
    logo_white: row.logoWhite,
  }
}

export function chunkPartnerRows<T>(rows: readonly T[], size: number): T[][] {
  if (rows.length === 0) return []
  if (size <= 0) return [rows.slice()]

  const chunks: T[][] = []
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size))
  }
  return chunks
}
