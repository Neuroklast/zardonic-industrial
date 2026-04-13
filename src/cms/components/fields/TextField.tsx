/**
 * TextField
 *
 * Controlled single-line text input for admin fields.
 * Renders inside a `FieldWrapper` with label, tooltip, and error support.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const BASE_INPUT =
  'w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 disabled:opacity-50'

export interface TextFieldProps {
  fieldDef: AdminFieldDefinition
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

/** Single-line text input for admin string fields. */
export function TextField({ fieldDef, value, onChange, error, disabled, className }: TextFieldProps) {
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
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={fieldDef.placeholder}
        disabled={disabled}
        className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
        aria-label={fieldDef.label}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FieldWrapper>
  )
}

export default TextField
