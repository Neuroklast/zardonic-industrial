/**
 * EmptyState
 *
 * Friendly empty state shown when a section has no saved data yet.
 * Displays the section description and a "Start editing" call-to-action.
 */

import { PencilSimple } from '@phosphor-icons/react'
import { SchemaIcon } from '@/cms/components/SchemaIcon'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Section label. */
  label: string
  /** Section description explaining what the section does. */
  description?: string
  /** Schema icon name. */
  icon?: string
  /** Number of editable fields in this section. */
  fieldCount?: number
  /** Called when the user clicks "Start editing". */
  onStartEditing?: () => void
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

/**
 * Displayed when a section has no data yet.
 * Invites the user to start configuring it.
 */
export function EmptyState({
  label,
  description,
  icon,
  fieldCount,
  onStartEditing,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center"
      role="status"
      aria-label={`${label} — no data yet`}
    >
      {/* Icon */}
      <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
        {icon ? (
          <SchemaIcon iconName={icon} size={28} className="text-zinc-500" />
        ) : (
          <PencilSimple size={28} className="text-zinc-500" />
        )}
      </div>

      {/* Text */}
      <div className="space-y-2 max-w-xs">
        <p className="text-zinc-300 font-mono text-sm font-semibold">{label} is empty</p>
        {description && (
          <p className="text-zinc-600 text-xs leading-relaxed">{description}</p>
        )}
        {fieldCount !== undefined && fieldCount > 0 && (
          <p className="text-zinc-700 text-xs font-mono">
            {fieldCount} {fieldCount === 1 ? 'field' : 'fields'} available to configure
          </p>
        )}
      </div>

      {/* CTA */}
      {onStartEditing && (
        <button
          type="button"
          onClick={onStartEditing}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
          aria-label={`Start editing ${label}`}
        >
          <PencilSimple size={13} />
          Start editing
        </button>
      )}
    </div>
  )
}
