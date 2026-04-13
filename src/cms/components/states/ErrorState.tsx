/**
 * ErrorState
 *
 * Consistent error display for the CMS section editor.
 * Shows an error icon, message, retry button, and optionally
 * a collapsible section with technical details.
 *
 * Variants:
 *   - 'network'  — connectivity / fetch failure
 *   - 'auth'     — authentication required or expired
 *   - 'notFound' — section or resource not found
 *   - 'generic'  — catch-all error
 */

import { useState } from 'react'
import { Warning, WifiX, LockKey, MagnifyingGlass, CaretDown, CaretRight, ArrowCounterClockwise } from '@phosphor-icons/react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorVariant = 'network' | 'auth' | 'notFound' | 'generic'

export interface ErrorStateProps {
  /** Human-readable error message. */
  message: string
  /** Variant controls icon and default heading. */
  variant?: ErrorVariant
  /** Optional detailed technical error (shown in collapsible). */
  detail?: string
  /** Called when the user clicks "Retry". Omit to hide the button. */
  onRetry?: () => void
}

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  ErrorVariant,
  { heading: string; icon: React.ReactNode }
> = {
  network: {
    heading: 'Connection error',
    icon: <WifiX size={36} className="text-red-500/60" />,
  },
  auth: {
    heading: 'Authentication required',
    icon: <LockKey size={36} className="text-amber-500/60" />,
  },
  notFound: {
    heading: 'Not found',
    icon: <MagnifyingGlass size={36} className="text-zinc-500/60" />,
  },
  generic: {
    heading: 'Something went wrong',
    icon: <Warning size={36} className="text-red-500/60" />,
  },
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

/**
 * Full-page error state for the section editor.
 * Displays a contextual icon, heading, message, and optional retry action.
 */
export function ErrorState({
  message,
  variant = 'generic',
  detail,
  onRetry,
}: ErrorStateProps) {
  const [showDetail, setShowDetail] = useState(false)
  const config = VARIANT_CONFIG[variant]

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      {config.icon}

      <div className="space-y-1 max-w-sm">
        <p className="text-zinc-300 font-mono text-sm font-semibold">{config.heading}</p>
        <p className="text-zinc-500 text-xs font-mono leading-relaxed">{message}</p>
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-xs font-mono transition-colors"
          aria-label="Retry loading"
        >
          <ArrowCounterClockwise size={13} />
          Retry
        </button>
      )}

      {/* Collapsible technical details */}
      {detail && (
        <div className="w-full max-w-sm mt-2">
          <button
            type="button"
            onClick={() => setShowDetail(v => !v)}
            className="flex items-center gap-1 text-zinc-700 hover:text-zinc-500 text-xs font-mono transition-colors mx-auto"
            aria-expanded={showDetail}
          >
            {showDetail ? <CaretDown size={10} /> : <CaretRight size={10} />}
            Technical details
          </button>
          {showDetail && (
            <pre className="mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-500 text-left overflow-auto max-h-32 whitespace-pre-wrap break-all">
              {detail}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
