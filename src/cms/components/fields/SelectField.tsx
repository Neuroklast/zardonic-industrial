/**
 * SelectField
 *
 * Controlled dropdown select for admin enum / option fields.
 * Options are driven by `fieldDef.options`.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const BASE_INPUT =
  'w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 disabled:opacity-50'

export interface SelectFieldProps {
  fieldDef: AdminFieldDefinition
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

/** Dropdown select input for admin option fields. */
export function SelectField({ fieldDef, value, onChange, error, disabled, className }: SelectFieldProps) {
  const id = `field-${fieldDef.key}`
  const options = fieldDef.options ?? []

  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
        aria-label={fieldDef.label}
        aria-invalid={Boolean(error)}
      >
        <option value="">— Select —</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}

export default SelectField
