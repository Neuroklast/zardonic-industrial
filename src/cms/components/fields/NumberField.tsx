/**
 * NumberField
 *
 * Controlled numeric input (with optional range slider) for admin fields.
 * When both `min` and `max` are defined in the validation, also renders a slider.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const BASE_INPUT =
  'w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 disabled:opacity-50'

export interface NumberFieldProps {
  fieldDef: AdminFieldDefinition
  value: number
  onChange: (value: number) => void
  error?: string
  disabled?: boolean
  /** When true, renders a range slider instead of a number text box. */
  asSlider?: boolean
  className?: string
}

/** Numeric input field. Pass `asSlider={true}` to render a range slider. */
export function NumberField({ fieldDef, value, onChange, error, disabled, asSlider, className }: NumberFieldProps) {
  const id = `field-${fieldDef.key}`
  const min = fieldDef.validation?.min ?? undefined
  const max = fieldDef.validation?.max ?? undefined
  const step = fieldDef.type === 'number' ? undefined : 0.01

  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      {asSlider ? (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step ?? 0.01}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="flex-1 accent-red-600 disabled:opacity-50"
            aria-label={fieldDef.label}
          />
          <span className="text-zinc-400 text-xs font-mono w-10 text-right tabular-nums">
            {value.toFixed(2)}
          </span>
        </div>
      ) : (
        <input
          id={id}
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          disabled={disabled}
          placeholder={fieldDef.placeholder}
          className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
          aria-label={fieldDef.label}
          aria-invalid={Boolean(error)}
        />
      )}
    </FieldWrapper>
  )
}

export default NumberField
