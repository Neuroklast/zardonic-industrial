import type { Gig } from '@/lib/app-types'

const DEFAULT_EVENT_HOURS = 3

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** Format a Date as UTC iCalendar datetime (YYYYMMDDTHHMMSSZ). */
export function formatIcsUtcDate(date: Date): string {
  return (
    `${date.getUTCFullYear()}` +
    `${pad2(date.getUTCMonth() + 1)}` +
    `${pad2(date.getUTCDate())}T` +
    `${pad2(date.getUTCHours())}` +
    `${pad2(date.getUTCMinutes())}` +
    `${pad2(date.getUTCSeconds())}Z`
  )
}

/** Escape text for iCalendar property values (RFC 5545). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function slugifyFilename(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'event'
}

export function buildGigIcsContent(gig: Gig, artistName: string): string {
  const start = new Date(gig.startsAt ?? gig.date)
  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid gig date')
  }

  const end = new Date(start.getTime() + DEFAULT_EVENT_HOURS * 60 * 60 * 1000)
  const summary = escapeIcsText(`${artistName} @ ${gig.venue}`)
  const location = escapeIcsText(
    [gig.streetAddress, gig.postalCode, gig.location].filter(Boolean).join(', ') || gig.location,
  )
  const descriptionParts = [
    gig.title && gig.title !== gig.venue ? gig.title : '',
    gig.description ?? '',
    gig.ticketUrl ? `Tickets: ${gig.ticketUrl}` : '',
  ].filter(Boolean)
  const description = descriptionParts.length > 0 ? escapeIcsText(descriptionParts.join('\n')) : ''

  const uid = `${gig.id}@zardonic`
  const dtstamp = formatIcsUtcDate(new Date())

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zardonic//Gig Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatIcsUtcDate(start)}`,
    `DTEND:${formatIcsUtcDate(end)}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : '',
    description ? `DESCRIPTION:${description}` : '',
    gig.ticketUrl ? `URL:${gig.ticketUrl}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

export function getGigIcsFilename(gig: Gig): string {
  const date = new Date(gig.startsAt ?? gig.date)
  const datePart = Number.isNaN(date.getTime())
    ? 'event'
    : `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
  return `${slugifyFilename(gig.venue)}-${datePart}.ics`
}

export function downloadGigIcs(gig: Gig, artistName: string): void {
  const content = buildGigIcsContent(gig, artistName)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = getGigIcsFilename(gig)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}