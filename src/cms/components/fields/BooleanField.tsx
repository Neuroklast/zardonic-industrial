/**
 * BooleanField
 *
 * Controlled checkbox / toggle input for admin boolean fields.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

export interface BooleanFieldProps {
  fieldDef: AdminFieldDefinition
  value: boolean
  onChange: (value: boolean) => void
  error?: string
  disabled?: boolean
  className?: string
}

/** Checkbox toggle for admin boolean fields. */
export function BooleanField({ fieldDef, value, onChange, error, disabled, className }: BooleanFieldProps) {
  const id = `field-${fieldDef.key}`
  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className="accent-red-600 w-4 h-4 cursor-pointer disabled:opacity-50"
          aria-label={fieldDef.label}
          aria-invalid={Boolean(error)}
        />
        <span className="text-xs font-mono text-zinc-500">
          {value ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </FieldWrapper>
  )
}

export default BooleanField
