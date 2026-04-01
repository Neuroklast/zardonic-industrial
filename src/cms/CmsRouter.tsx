/**
 * CmsRouter — route definitions for the CMS at /cms/*.
 * Protected: redirects to login if not authenticated.
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CmsLayout } from './CmsLayout'
import { useCmsAuth } from './hooks/useCmsAuth'

// Lazy load pages for code splitting
const DashboardHome = lazy(() => import('./pages/DashboardHome').then(m => ({ default: m.DashboardHome })))
const SiteSettings = lazy(() => import('./pages/SiteSettings').then(m => ({ default: m.SiteSettings })))
const SectionsManager = lazy(() => import('./pages/SectionsManager').then(m => ({ default: m.SectionsManager })))
const ReleasesManager = lazy(() => import('./pages/ReleasesManager').then(m => ({ default: m.ReleasesManager })))
const ReleaseEditor = lazy(() => import('./pages/ReleaseEditor').then(m => ({ default: m.ReleaseEditor })))
const GigsManager = lazy(() => import('./pages/GigsManager').then(m => ({ default: m.GigsManager })))
const GigEditor = lazy(() => import('./pages/GigEditor').then(m => ({ default: m.GigEditor })))
const VideosManager = lazy(() => import('./pages/VideosManager').then(m => ({ default: m.VideosManager })))
const VideoEditor = lazy(() => import('./pages/VideoEditor').then(m => ({ default: m.VideoEditor })))
const MembersManager = lazy(() => import('./pages/MembersManager').then(m => ({ default: m.MembersManager })))
const NewsManager = lazy(() => import('./pages/NewsManager').then(m => ({ default: m.NewsManager })))
const NewsEditor = lazy(() => import('./pages/NewsEditor').then(m => ({ default: m.NewsEditor })))
const BiographyEditor = lazy(() => import('./pages/BiographyEditor').then(m => ({ default: m.BiographyEditor })))
const MediaLibrary = lazy(() => import('./pages/MediaLibrary').then(m => ({ default: m.MediaLibrary })))
const NewsletterManager = lazy(() => import('./pages/NewsletterManager').then(m => ({ default: m.NewsletterManager })))
const ActivityLogPage = lazy(() => import('./pages/ActivityLog').then(m => ({ default: m.ActivityLogPage })))

function CmsGuard({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useCmsAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-zinc-500 font-mono text-sm">Authentifiziere…</div>
  if (!authenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

const Loader = () => <div className="p-6 text-zinc-500 font-mono text-sm">Lädt…</div>

export function CmsRouter() {
  return (
    <CmsGuard>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<CmsLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="settings" element={<SiteSettings />} />
            <Route path="sections" element={<SectionsManager />} />
            <Route path="releases" element={<ReleasesManager />} />
            <Route path="releases/:id" element={<ReleaseEditor />} />
            <Route path="gigs" element={<GigsManager />} />
            <Route path="gigs/:id" element={<GigEditor />} />
            <Route path="videos" element={<VideosManager />} />
            <Route path="videos/:id" element={<VideoEditor />} />
            <Route path="members" element={<MembersManager />} />
            <Route path="news" element={<NewsManager />} />
            <Route path="news/:id" element={<NewsEditor />} />
            <Route path="biography" element={<BiographyEditor />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="newsletter" element={<NewsletterManager />} />
            <Route path="activity" element={<ActivityLogPage />} />
          </Route>
        </Routes>
      </Suspense>
    </CmsGuard>
  )
}
