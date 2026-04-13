/**
 * DateField
 *
 * Controlled date input (HTML5 date picker) for admin date fields.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const BASE_INPUT =
  'w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 disabled:opacity-50'

export interface DateFieldProps {
  fieldDef: AdminFieldDefinition
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

/** HTML5 date picker for admin date fields. Value is in ISO 8601 format (YYYY-MM-DD). */
export function DateField({ fieldDef, value, onChange, error, disabled, className }: DateFieldProps) {
  const id = `field-${fieldDef.key}`
  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      <input
        id={id}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
        aria-label={fieldDef.label}
        aria-invalid={Boolean(error)}
      />
    </FieldWrapper>
  )
}

export default DateField
