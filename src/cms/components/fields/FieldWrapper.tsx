/**
 * FieldWrapper
 *
 * Shared wrapper component for all admin field components.
 * Provides consistent layout with label (+ optional tooltip), error message,
 * and optional description text below the input.
 *
 * All field components in this directory MUST use `FieldWrapper` as their
 * root container to guarantee visual consistency across the admin UI.
 */

import { InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface FieldWrapperProps {
  /** Unique HTML id used to associate the label with the input via htmlFor. */
  fieldId: string
  /** Human-readable label shown above the input. */
  label: string
  /** Optional contextual help text shown in a hoverable tooltip. */
  tooltip?: string
  /** Validation error message. When non-empty, the label and border turn red. */
  error?: string
  /** Optional helper text shown below the input in muted colour. */
  description?: string
  /** The form input(s) to render inside the wrapper. */
  children: React.ReactNode
  /** Optional extra CSS classes applied to the root container. */
  className?: string
}

/**
 * Shared field wrapper with label, tooltip, error, and description slots.
 *
 * Renders a consistent admin field layout:
 *
 * ```
 * [Label]  [ℹ tooltip icon]
 * [input / children]
 * [error message or description]
 * ```
 */
export function FieldWrapper({
  fieldId,
  label,
  tooltip,
  error,
  description,
  children,
  className,
}: FieldWrapperProps) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      {/* Label row */}
      <div className="flex items-center gap-1">
        <label
          htmlFor={fieldId}
          className={`text-xs font-mono cursor-default ${error ? 'text-red-400' : 'text-zinc-400'}`}
        >
          {label}
        </label>

        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-zinc-600 hover:text-zinc-400 transition-colors focus:outline-none"
                aria-label={`Help: ${label}`}
                tabIndex={0}
              >
                <InfoIcon size={11} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs text-xs bg-zinc-900 border border-zinc-700 text-zinc-200"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Input slot */}
      {children}

      {/* Error or description */}
      {error ? (
        <p className="text-xs font-mono text-red-400" role="alert">
          {error}
        </p>
      ) : description ? (
        <p className="text-[10px] font-mono text-zinc-600">{description}</p>
      ) : null}
    </div>
  )
}

export default FieldWrapper
