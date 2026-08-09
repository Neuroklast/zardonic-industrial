'use client'

import { useMemo, useState } from 'react'
import type { AnalyticsInsights, HeatPoint, NamedCount } from '@/lib/analytics-insights'

interface AnalyticsDashboardProps {
  insights: AnalyticsInsights
  sampleSize: number
  rangeDays: number
}

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  )
}

function RankList({ title, items, empty }: { title: string; items: NamedCount[]; empty: string }) {
  const max = items[0]?.count ?? 1
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-200">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.name}>
              <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-mono text-zinc-300" title={item.name}>
                  {item.name}
                </span>
                <span className="shrink-0 font-mono text-zinc-400">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-600/80"
                  style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TimelineChart({
  daily,
}: {
  daily: AnalyticsInsights['daily']
}) {
  const max = Math.max(1, ...daily.map((d) => d.pageViews), ...daily.map((d) => d.events))
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-1 text-sm font-semibold text-zinc-200">Traffic over time</h3>
      <p className="mb-4 text-[11px] text-zinc-500">Page views (red) vs all events (zinc) per day</p>
      <div className="flex h-40 items-end gap-1">
        {daily.map((d) => (
          <div key={d.date} className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5">
            <div
              className="w-full rounded-t bg-zinc-600/60"
              style={{ height: `${(d.events / max) * 100}%`, minHeight: d.events > 0 ? 2 : 0 }}
              title={`${d.date}: ${d.events} events, ${d.pageViews} views, ${d.sessions} sessions`}
            />
            <div
              className="absolute bottom-0 w-[70%] rounded-t bg-red-600"
              style={{ height: `${(d.pageViews / max) * 100}%`, minHeight: d.pageViews > 0 ? 2 : 0 }}
            />
            <span className="pointer-events-none absolute -top-6 hidden rounded bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-zinc-200 group-hover:block">
              {d.date.slice(5)} · {d.pageViews}v
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-600">
        <span>{daily[0]?.date.slice(5)}</span>
        <span>{daily[daily.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}

function HeatmapPanel({ points, pages }: { points: HeatPoint[]; pages: NamedCount[] }) {
  const [page, setPage] = useState<string>(() => pages[0]?.name ?? 'all')

  const filtered = useMemo(() => {
    if (page === 'all') return points
    return points.filter((p) => p.page === page)
  }, [page, points])

  // Simple density grid 24x16 over viewport-normalized coords (y may exceed 1 for long pages)
  const cols = 24
  const rows = 16
  const grid = useMemo(() => {
    const cells = Array.from({ length: rows * cols }, () => 0)
    for (const p of filtered) {
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x * cols)))
      const cy = Math.min(rows - 1, Math.max(0, Math.floor((p.y / 2) * rows)))
      cells[cy * cols + cx] += 1
    }
    return cells
  }, [filtered])

  const maxCell = Math.max(1, ...grid)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Click heatmap</h3>
          <p className="text-[11px] text-zinc-500">
            Relative click positions on the page (viewport width × scroll-aware height). {filtered.length} points.
          </p>
        </div>
        <select
          value={page}
          onChange={(e) => setPage(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-300"
          aria-label="Heatmap page filter"
        >
          <option value="all">All pages</option>
          {pages.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p.count})
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No click heatmap data yet. Enable analytics, accept cookies, and click around the public site.
        </p>
      ) : (
        <div
          className="relative mx-auto aspect-[3/2] w-full max-w-2xl overflow-hidden rounded border border-zinc-800 bg-zinc-950"
          role="img"
          aria-label="Heatmap grid"
        >
          <div
            className="grid h-full w-full"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
          >
            {grid.map((v, i) => {
              const t = v / maxCell
              const bg =
                v === 0
                  ? 'transparent'
                  : `color-mix(in srgb, #dc2626 ${Math.round(20 + t * 80)}%, transparent)`
              return (
                <div
                  key={i}
                  className="border border-zinc-900/40"
                  style={{ background: bg }}
                  title={v > 0 ? `${v} clicks` : undefined}
                />
              )
            })}
          </div>
          {/* scatter overlay for precision */}
          {filtered.slice(0, 400).map((p, i) => (
            <span
              key={i}
              className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400/70 shadow-[0_0_6px_rgba(220,38,38,0.8)]"
              style={{ left: `${p.x * 100}%`, top: `${(p.y / 2) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function AnalyticsDashboard({ insights, sampleSize, rangeDays }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-300">Live site analytics</h2>
          <p className="text-xs text-zinc-500">
            Last {rangeDays} days · {sampleSize.toLocaleString()} events loaded · consent-gated only
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Page views" value={insights.pageViews} />
        <KpiCard label="Sessions" value={insights.uniqueSessions} hint="Approx. unique session IDs" />
        <KpiCard label="Section views" value={insights.sectionViews} />
        <KpiCard label="Clicks" value={insights.clicks} />
        <KpiCard label="All events" value={insights.totalEvents} />
      </div>

      <TimelineChart daily={insights.daily} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RankList title="Top pages" items={insights.topPages} empty="No page views yet." />
        <RankList title="Top sections" items={insights.topSections} empty="No section views yet." />
        <RankList title="Top click targets" items={insights.topClicks} empty="No clicks tracked yet." />
        <RankList title="Referrers" items={insights.referrers} empty="No referrer data yet." />
        <RankList title="Devices" items={insights.devices} empty="No device data yet." />
        <RankList title="Heatmap pages" items={insights.heatByPage} empty="No heatmap points yet." />
      </div>

      <HeatmapPanel points={insights.heatPoints} pages={insights.heatByPage} />

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Data is first-party only (your Supabase <code className="text-zinc-500">analytics_events</code> table).
        Tracking requires analytics enabled above and visitor cookie consent. No third-party ads pixels.
      </p>
    </div>
  )
}
