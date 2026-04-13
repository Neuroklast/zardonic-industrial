/**
 * TextAreaField
 *
 * Controlled multi-line textarea input for admin fields.
 * Renders inside a `FieldWrapper` with label, tooltip, and error support.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const BASE_INPUT =
  'w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 resize-y disabled:opacity-50'

export interface TextAreaFieldProps {
  fieldDef: AdminFieldDefinition
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  rows?: number
  className?: string
}

/** Multi-line textarea input for admin string fields. */
export function TextAreaField({ fieldDef, value, onChange, error, disabled, rows = 3, className }: TextAreaFieldProps) {
  const id = `field-${fieldDef.key}`
  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={fieldDef.placeholder}
        disabled={disabled}
        rows={rows}
        className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
        aria-label={fieldDef.label}
        aria-invalid={Boolean(error)}
      />
    </FieldWrapper>
  )
}

export default TextAreaField
