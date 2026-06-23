export interface IsoDateParts {
  year: number
  month: number
  day: number
}

/** Parse YYYY-MM-DD (or ISO datetime) into UTC calendar parts without local TZ drift. */
export function parseIsoDateParts(iso: string): IsoDateParts | null {
  const trimmed = iso.trim()
  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnly) {
    return {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]),
      day: Number(dateOnly[3]),
    }
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

/** Compact DDMMYYYY label for HUD-style gig markers (UTC-stable for SSR hydration). */
export function formatIsoDateCompact(iso: string): string {
  const parts = parseIsoDateParts(iso)
  if (!parts) return iso.replaceAll('-', '')
  const { day, month, year } = parts
  return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`
}

/** Long display date for cards/lists (UTC-stable for SSR hydration). */
export function formatIsoDateLong(iso: string): string {
  const parts = parseIsoDateParts(iso)
  if (!parts) return iso

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}