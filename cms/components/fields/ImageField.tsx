/**
 * ImageField
 *
 * Controlled image URL input with inline thumbnail preview for admin image fields.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

const BASE_INPUT =
  'w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/60 disabled:opacity-50'

export interface ImageFieldProps {
  fieldDef: AdminFieldDefinition
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

/** Image URL field with inline thumbnail preview. */
export function ImageField({ fieldDef, value, onChange, error, disabled, className }: ImageFieldProps) {
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
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={fieldDef.placeholder ?? 'https://...'}
        disabled={disabled}
        className={`${BASE_INPUT}${error ? ' border-red-500/60' : ''}`}
        aria-label={fieldDef.label}
        aria-invalid={Boolean(error)}
      />
      {value && (
        <div className="mt-1">
          <img
            src={value}
            alt="Preview"
            className="h-16 w-auto rounded border border-zinc-700 object-cover"
            onError={e => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </FieldWrapper>
  )
}

export default ImageField
