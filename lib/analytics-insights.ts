/**
 * Pure aggregation helpers for analytics_events rows (admin dashboard).
 */

export type AnalyticsEventRow = {
  id: string
  type: string
  target: string | null
  meta: Record<string, unknown> | null
  heatmap: { x?: number; y?: number; page?: string; elementTag?: string } | null
  created_at: string
}

export type DayBucket = { date: string; pageViews: number; events: number; sessions: Set<string> }

export type NamedCount = { name: string; count: number }

export type HeatPoint = { x: number; y: number; page: string }

export type AnalyticsInsights = {
  totalEvents: number
  pageViews: number
  sectionViews: number
  clicks: number
  uniqueSessions: number
  rangeDays: number
  daily: Array<{ date: string; pageViews: number; events: number; sessions: number }>
  topPages: NamedCount[]
  topSections: NamedCount[]
  topClicks: NamedCount[]
  referrers: NamedCount[]
  devices: NamedCount[]
  heatPoints: HeatPoint[]
  heatByPage: NamedCount[]
}

function sessionIdOf(row: AnalyticsEventRow): string {
  const id = row.meta?.sessionId
  return typeof id === 'string' && id.length > 0 ? id : `anon-${row.id}`
}

function dayKey(iso: string): string {
  // YYYY-MM-DD UTC for stable buckets
  return iso.slice(0, 10)
}

function topN(map: Map<string, number>, n: number): NamedCount[] {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

function emptyDays(rangeDays: number, end = new Date()): string[] {
  const days: string[] = []
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
    d.setUTCDate(d.getUTCDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export function buildAnalyticsInsights(
  rows: AnalyticsEventRow[],
  rangeDays = 14,
): AnalyticsInsights {
  const sessions = new Set<string>()
  let pageViews = 0
  let sectionViews = 0
  let clicks = 0

  const dailyMap = new Map<string, DayBucket>()
  for (const d of emptyDays(rangeDays)) {
    dailyMap.set(d, { date: d, pageViews: 0, events: 0, sessions: new Set() })
  }

  const pages = new Map<string, number>()
  const sections = new Map<string, number>()
  const clickTargets = new Map<string, number>()
  const referrers = new Map<string, number>()
  const devices = new Map<string, number>()
  const heatPoints: HeatPoint[] = []
  const heatPages = new Map<string, number>()

  for (const row of rows) {
    const sid = sessionIdOf(row)
    sessions.add(sid)

    const day = dayKey(row.created_at)
    let bucket = dailyMap.get(day)
    if (!bucket) {
      bucket = { date: day, pageViews: 0, events: 0, sessions: new Set() }
      dailyMap.set(day, bucket)
    }
    bucket.events += 1
    bucket.sessions.add(sid)

    if (row.type === 'page_view') {
      pageViews += 1
      bucket.pageViews += 1
      const path = row.target || '/'
      pages.set(path, (pages.get(path) ?? 0) + 1)
    } else if (row.type === 'section_view') {
      sectionViews += 1
      const sec = row.target || 'unknown'
      sections.set(sec, (sections.get(sec) ?? 0) + 1)
    } else if (row.type === 'click' || row.type === 'interaction') {
      clicks += 1
      const t = row.target || 'unknown'
      clickTargets.set(t, (clickTargets.get(t) ?? 0) + 1)
    }

    const ref = typeof row.meta?.referrer === 'string' ? row.meta.referrer : ''
    if (ref) {
      try {
        const host = new URL(ref).hostname || ref
        referrers.set(host, (referrers.get(host) ?? 0) + 1)
      } catch {
        referrers.set(ref.slice(0, 40), (referrers.get(ref.slice(0, 40)) ?? 0) + 1)
      }
    } else if (row.type === 'page_view') {
      referrers.set('(direct)', (referrers.get('(direct)') ?? 0) + 1)
    }

    const device = typeof row.meta?.device === 'string' ? row.meta.device : ''
    if (device) devices.set(device, (devices.get(device) ?? 0) + 1)

    if (row.heatmap && typeof row.heatmap.x === 'number' && typeof row.heatmap.y === 'number') {
      const page = row.heatmap.page || row.target || '/'
      heatPoints.push({
        x: Math.min(1, Math.max(0, row.heatmap.x)),
        y: Math.min(2, Math.max(0, row.heatmap.y)),
        page,
      })
      heatPages.set(page, (heatPages.get(page) ?? 0) + 1)
    }
  }

  const daily = [...dailyMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((b) => ({
      date: b.date,
      pageViews: b.pageViews,
      events: b.events,
      sessions: b.sessions.size,
    }))

  return {
    totalEvents: rows.length,
    pageViews,
    sectionViews,
    clicks,
    uniqueSessions: sessions.size,
    rangeDays,
    daily,
    topPages: topN(pages, 10),
    topSections: topN(sections, 10),
    topClicks: topN(clickTargets, 10),
    referrers: topN(referrers, 8),
    devices: topN(devices, 6),
    heatPoints: heatPoints.slice(0, 2000),
    heatByPage: topN(heatPages, 12),
  }
}
