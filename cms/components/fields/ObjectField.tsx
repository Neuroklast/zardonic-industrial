/**
 * ObjectField
 *
 * Renders a nested set of fields for admin `object` type fields.
 * Each property in the object schema is rendered using the standard field
 * dispatch from `SectionEditorFactory`.
 *
 * This component is intentionally kept simple — it renders the sub-fields
 * inline with an indented visual separator. Complex nested objects with many
 * fields should be considered for their own dedicated schema section.
 */

import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

export interface ObjectFieldProps {
  fieldDef: AdminFieldDefinition
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
  error?: string
  disabled?: boolean
  /** Render function for sub-fields. Provided by SectionEditorFactory. */
  renderSubField: (
    subFieldDef: AdminFieldDefinition,
    subValue: unknown,
    onSubChange: (val: unknown) => void,
  ) => React.ReactNode
  className?: string
}

/**
 * Renders a collapsible group of sub-fields for a nested object.
 * Sub-field rendering is delegated to `renderSubField` (provided by the factory).
 */
export function ObjectField({
  fieldDef,
  value,
  onChange,
  error,
  disabled: _disabled,
  renderSubField,
  className,
}: ObjectFieldProps) {
  const id = `field-${fieldDef.key}`
  const subSchema = fieldDef.objectSchema ?? []

  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      <div className="pl-3 border-l border-zinc-800 space-y-3 mt-1">
        {subSchema.map(subDef => (
          <div key={subDef.key}>
            {renderSubField(
              subDef,
              value[subDef.key],
              (val) => onChange({ ...value, [subDef.key]: val }),
            )}
          </div>
        ))}
      </div>
    </FieldWrapper>
  )
}

export default ObjectField
