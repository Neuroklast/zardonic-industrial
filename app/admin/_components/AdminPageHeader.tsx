import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {description && <p className="text-zinc-400 text-sm mt-1 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 shrink-0">{action}</div>}
    </div>
  )
}