/**
 * LoadingState
 *
 * Skeleton loader that matches the CMS section editor form layout.
 * Shown while data is being fetched for a section.
 *
 * Features:
 *   - Pulsing skeleton blocks matching the cyberpunk theme
 *   - Shows section icon and name while loading
 *   - Respects prefers-reduced-motion
 */

import { SchemaIcon } from '@/cms/components/SchemaIcon'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LoadingStateProps {
  /** Section label shown above the skeleton. */
  label?: string
  /** Schema icon name rendered next to the label. */
  icon?: string
}

// ─── LoadingState ─────────────────────────────────────────────────────────────

/**
 * Skeleton loading state for the section editor.
 * Renders a form-like skeleton with the section's icon and name.
 */
export function LoadingState({ label, icon }: LoadingStateProps) {
  return (
    <div
      className="flex-1 p-6 space-y-6 overflow-hidden"
      aria-busy="true"
      aria-label={label ? `Loading ${label}` : 'Loading'}
      role="status"
    >
      {/* Section identity row */}
      {(icon || label) && (
        <div className="flex items-center gap-3 mb-6">
          {icon && (
            <div className="w-9 h-9 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 flex-shrink-0">
              <SchemaIcon iconName={icon} size={18} className="text-zinc-600" />
            </div>
          )}
          {label && (
            <div className="space-y-1.5 min-w-0">
              <div className="text-zinc-400 font-mono text-sm">{label}</div>
              <div className="skeleton-pulse bg-zinc-800 h-3 w-32 rounded" />
            </div>
          )}
        </div>
      )}

      {/* Field group skeleton 1 — expanded */}
      <div className="border border-zinc-800 rounded overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60">
          <div className="skeleton-pulse bg-zinc-700 h-2 w-2 rounded" />
          <div className="skeleton-pulse bg-zinc-700 h-2 w-20 rounded" />
        </div>
        <div className="px-3 py-3 space-y-4">
          <FieldSkeleton labelWidth="w-24" />
          <FieldSkeleton labelWidth="w-32" inputHeight="h-16" />
          <FieldSkeleton labelWidth="w-20" />
        </div>
      </div>

      {/* Field group skeleton 2 — collapsed */}
      <div className="border border-zinc-800 rounded overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60">
          <div className="skeleton-pulse bg-zinc-800 h-2 w-2 rounded" />
          <div className="skeleton-pulse bg-zinc-800 h-2 w-16 rounded" />
        </div>
      </div>

      {/* Field group skeleton 3 — collapsed */}
      <div className="border border-zinc-800 rounded overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60">
          <div className="skeleton-pulse bg-zinc-800 h-2 w-2 rounded" />
          <div className="skeleton-pulse bg-zinc-800 h-2 w-24 rounded" />
        </div>
      </div>
    </div>
  )
}

// ─── FieldSkeleton ────────────────────────────────────────────────────────────

function FieldSkeleton({
  labelWidth = 'w-28',
  inputHeight = 'h-8',
}: {
  labelWidth?: string
  inputHeight?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className={`skeleton-pulse bg-zinc-800 h-2.5 ${labelWidth} rounded`} />
      <div className={`skeleton-pulse bg-zinc-900 border border-zinc-800 ${inputHeight} w-full rounded`} />
    </div>
  )
}
