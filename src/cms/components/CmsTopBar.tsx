/**
 * CmsTopBar — breadcrumbs, save/publish controls, and user info.
 */

import { type ReactNode } from 'react'

interface Props {
  title: string
  breadcrumbs?: string[]
  actions?: ReactNode
}

export function CmsTopBar({ title, breadcrumbs, actions }: Props) {
  return (
    <header className="h-14 border-b border-zinc-800 bg-[#0d0d0d] flex items-center justify-between px-6 flex-shrink-0">
      <div>
        {breadcrumbs && (
          <nav className="text-zinc-600 text-xs font-mono mb-0.5">
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                <span>{b}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-sm font-mono text-white uppercase tracking-wide">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  )
}
