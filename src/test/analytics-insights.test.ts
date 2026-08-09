import { describe, expect, it } from 'vitest'
import { buildAnalyticsInsights, type AnalyticsEventRow } from '@/lib/analytics-insights'

function row(
  partial: Partial<AnalyticsEventRow> & Pick<AnalyticsEventRow, 'id' | 'type'>,
): AnalyticsEventRow {
  return {
    target: null,
    meta: null,
    heatmap: null,
    created_at: '2026-08-01T12:00:00.000Z',
    ...partial,
  }
}

describe('buildAnalyticsInsights', () => {
  it('aggregates page views, sessions, and tops', () => {
    const rows: AnalyticsEventRow[] = [
      row({
        id: '1',
        type: 'page_view',
        target: '/',
        meta: { sessionId: 's1', referrer: 'https://google.com/x', device: 'desktop' },
        created_at: '2026-08-01T10:00:00.000Z',
      }),
      row({
        id: '2',
        type: 'page_view',
        target: '/releases',
        meta: { sessionId: 's1', device: 'desktop' },
        created_at: '2026-08-01T11:00:00.000Z',
      }),
      row({
        id: '3',
        type: 'section_view',
        target: 'bio',
        meta: { sessionId: 's2', device: 'mobile' },
        created_at: '2026-08-02T10:00:00.000Z',
      }),
      row({
        id: '4',
        type: 'click',
        target: '#gigs',
        meta: { sessionId: 's2' },
        heatmap: { x: 0.5, y: 0.4, page: '/' },
        created_at: '2026-08-02T10:05:00.000Z',
      }),
    ]

    const insights = buildAnalyticsInsights(rows, 14)
    expect(insights.pageViews).toBe(2)
    expect(insights.sectionViews).toBe(1)
    expect(insights.clicks).toBe(1)
    expect(insights.uniqueSessions).toBe(2)
    expect(insights.topPages[0]?.name).toBe('/')
    expect(insights.topSections[0]?.name).toBe('bio')
    expect(insights.heatPoints).toHaveLength(1)
    expect(insights.referrers.some((r) => r.name.includes('google'))).toBe(true)
    expect(insights.devices.map((d) => d.name).sort()).toEqual(['desktop', 'mobile'])
  })

  it('returns empty-friendly structure for no events', () => {
    const insights = buildAnalyticsInsights([], 7)
    expect(insights.totalEvents).toBe(0)
    expect(insights.daily).toHaveLength(7)
    expect(insights.topPages).toEqual([])
  })
})
