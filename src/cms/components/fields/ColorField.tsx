/**
 * ColorField
 *
 * Controlled color picker with hex text fallback for admin color fields.
 * Renders a native color swatch plus a text input showing the hex value.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const BASE_INPUT =
  'flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 disabled:opacity-50'

export interface ColorFieldProps {
  fieldDef: AdminFieldDefinition
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

/** Color picker field with hex text fallback. */
export function ColorField({ fieldDef, value, onChange, error, disabled, className }: ColorFieldProps) {
  const id = `field-${fieldDef.key}`
  const safeValue = value || '#000000'

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
          type="color"
          value={safeValue}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer disabled:opacity-50"
          aria-label={fieldDef.label}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          disabled={disabled}
          className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
          aria-label={`${fieldDef.label} hex value`}
          aria-invalid={Boolean(error)}
        />
      </div>
    </FieldWrapper>
  )
}

export default ColorField
