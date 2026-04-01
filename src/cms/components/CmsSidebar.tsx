/**
 * CmsSidebar — industrial dark navigation sidebar.
 */

import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings,
  Layers,
  Music,
  Calendar,
  Video,
  Users,
  Newspaper,
  BookOpen,
  Image,
  Mail,
  Activity,
  X,
} from 'lucide-react'

interface Props {
  onClose?: () => void
}

const navItems = [
  { path: '/cms', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cms/settings', label: 'Site Settings', icon: Settings },
  { path: '/cms/sections', label: 'Sections', icon: Layers },
  { path: '/cms/releases', label: 'Releases', icon: Music },
  { path: '/cms/gigs', label: 'Tour Dates', icon: Calendar },
  { path: '/cms/videos', label: 'Videos', icon: Video },
  { path: '/cms/members', label: 'Shell Members', icon: Users },
  { path: '/cms/news', label: 'News', icon: Newspaper },
  { path: '/cms/biography', label: 'Biography', icon: BookOpen },
  { path: '/cms/media', label: 'Media Library', icon: Image },
  { path: '/cms/newsletter', label: 'Newsletter', icon: Mail },
  { path: '/cms/activity', label: 'Activity Log', icon: Activity },
]

export function CmsSidebar({ onClose }: Props) {
  const location = useLocation()

  return (
    <aside className="w-[260px] min-h-screen bg-[#0a0a0a] border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-mono font-bold text-sm tracking-widest">ZARDONIC</span>
          <span className="text-zinc-600 font-mono text-xs">// CMS</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 p-1">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/cms' ? location.pathname === '/cms' : location.pathname.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors border-l-2 ${
                isActive
                  ? 'border-red-500 text-red-400 bg-red-950/10'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <Link
          to="/"
          target="_blank"
          className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ↗ Website öffnen
        </Link>
      </div>
    </aside>
  )
}
