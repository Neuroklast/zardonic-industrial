/**
 * Normalize partial release dates (year-only, year-month) to PostgreSQL `date` values.
 * Spotify and Discogs often return "2026" or "2026-03" which are invalid for `date` columns.
 */
export function normalizeReleaseDateForDb(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`

  if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }

  return null
}