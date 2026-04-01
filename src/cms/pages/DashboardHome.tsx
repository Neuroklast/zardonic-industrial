/**
 * DashboardHome — quick stats, recent activity, and quick actions.
 */

import { useReleases, useGigs, useVideos, useNews, useActivityLog } from '../hooks/useCmsApi'
import { CmsTopBar } from '../components/CmsTopBar'
import { Link } from 'react-router-dom'

export function DashboardHome() {
  const releases = useReleases()
  const gigs = useGigs()
  const videos = useVideos()
  const news = useNews()
  const activity = useActivityLog({ limit: 10 })

  const stats = [
    { label: 'Releases', count: releases.data?.length ?? '—', path: '/cms/releases' },
    { label: 'Tour Dates', count: gigs.data?.length ?? '—', path: '/cms/gigs' },
    { label: 'Videos', count: videos.data?.length ?? '—', path: '/cms/videos' },
    { label: 'News Posts', count: news.data?.length ?? '—', path: '/cms/news' },
  ]

  interface LogEntry {
    id: string
    action: string
    entity: string
    entityId?: string
    createdAt: string
  }

  interface ActivityData {
    logs: LogEntry[]
  }

  const activityData = activity.data as ActivityData | undefined

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar title="Dashboard" breadcrumbs={['CMS', 'Dashboard']} />
      <div className="p-6 space-y-8">
        {/* Quick Stats */}
        <div>
          <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">// Quick Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, count, path }) => (
              <Link key={label} to={path} className="block p-4 border border-zinc-700 bg-[#111] hover:border-zinc-500 transition-colors">
                <div className="text-2xl font-mono text-red-400">{count}</div>
                <div className="text-xs font-mono text-zinc-500 mt-1">{label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">// Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '+ Release', path: '/cms/releases/new' },
              { label: '+ Gig', path: '/cms/gigs/new' },
              { label: '+ Video', path: '/cms/videos/new' },
              { label: '+ News Post', path: '/cms/news/new' },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className="px-4 py-2.5 text-sm font-mono border border-red-800 text-red-400 hover:bg-red-950/20 transition-colors text-center"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">// Recent Activity</h2>
          <div className="border border-zinc-800">
            {activity.isLoading ? (
              <div className="p-4 text-zinc-500 font-mono text-xs">Lädt…</div>
            ) : (activityData?.logs ?? []).length === 0 ? (
              <div className="p-4 text-zinc-500 font-mono text-xs">Keine Aktivität</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {(activityData?.logs ?? []).map((log) => (
                  <div key={log.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-red-400 uppercase">{log.action}</span>
                      <span className="text-xs font-mono text-zinc-400">{log.entity}</span>
                      {log.entityId && <span className="text-xs font-mono text-zinc-600">{log.entityId.slice(0, 8)}</span>}
                    </div>
                    <span className="text-xs font-mono text-zinc-600">
                      {new Date(log.createdAt).toLocaleString('de-DE')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
