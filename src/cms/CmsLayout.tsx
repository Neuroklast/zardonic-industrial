/**
 * CmsLayout — main layout wrapper for the CMS dashboard.
 * Includes sidebar, top area, and main content.
 */

import { useState, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { CmsSidebar } from './components/CmsSidebar'
import { CmsErrorBoundary } from './components/ErrorBoundary'
import { Menu } from 'lucide-react'

export function CmsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-200">
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <CmsSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <CmsSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile hamburger */}
        <div className="lg:hidden flex items-center gap-3 p-3 border-b border-zinc-800 bg-[#0d0d0d]">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 text-zinc-400 hover:text-white"
          >
            <Menu size={18} />
          </button>
          <span className="text-red-500 font-mono text-xs tracking-widest">ZARDONIC // CMS</span>
        </div>

        <CmsErrorBoundary>
          <Suspense fallback={<div className="p-6 text-zinc-500 font-mono text-sm">Lädt…</div>}>
            <Outlet />
          </Suspense>
        </CmsErrorBoundary>
      </div>
    </div>
  )
}
