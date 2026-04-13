/**
 * ArrayField
 *
 * Renders an editable ordered list of items for admin `array` type fields.
 * Each item's sub-fields are rendered using the `renderSubField` callback
 * provided by `SectionEditorFactory`.
 *
 * Features:
 *   - Add / remove items
 *   - Move item up / down
 *   - Each item collapsed into a header row (first sub-field value as label)
 */

import { useState } from 'react'
import { Plus, Trash, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react'
import { FieldWrapper } from './FieldWrapper'
import type { AdminFieldDefinition } from '@/lib/admin-section-schema'

export interface ArrayFieldProps {
  fieldDef: AdminFieldDefinition
  value: Record<string, unknown>[]
  onChange: (value: Record<string, unknown>[]) => void
  error?: string
  disabled?: boolean
  /** Render function for item sub-fields. Provided by SectionEditorFactory. */
  renderSubField: (
    subFieldDef: AdminFieldDefinition,
    subValue: unknown,
    onSubChange: (val: unknown) => void,
  ) => React.ReactNode
  className?: string
}

/** Returns a display label for an array item row using the first sub-field's string value. */
function getItemLabel(item: Record<string, unknown>, subSchema: AdminFieldDefinition[], index: number): string {
  for (const subDef of subSchema) {
    const val = item[subDef.key]
    if (typeof val === 'string' && val.trim()) return val
  }
  return `Item ${index + 1}`
}

/** Creates a blank item object from the sub-schema (all values empty string). */
function createBlankItem(subSchema: AdminFieldDefinition[]): Record<string, unknown> {
  return Object.fromEntries(
    subSchema.map(def => [def.key, def.defaultValue ?? '']),
  )
}

/** Editable ordered list for admin array fields. */
export function ArrayField({
  fieldDef,
  value,
  onChange,
  error,
  disabled,
  renderSubField,
  className,
}: ArrayFieldProps) {
  const id = `field-${fieldDef.key}`
  const subSchema = fieldDef.arrayItemSchema ?? []
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const addItem = () => {
    const newItems = [...value, createBlankItem(subSchema)]
    onChange(newItems)
    setExpandedIndex(newItems.length - 1)
  }

  const removeItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index)
    onChange(newItems)
    if (expandedIndex === index) setExpandedIndex(null)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= value.length) return
    const newItems = [...value]
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    onChange(newItems)
    setExpandedIndex(targetIndex)
  }

  const updateItem = (index: number, updated: Record<string, unknown>) => {
    const newItems = [...value]
    newItems[index] = updated
    onChange(newItems)
  }

  return (
    <FieldWrapper
      fieldId={id}
      label={fieldDef.label}
      tooltip={fieldDef.tooltip}
      error={error}
      className={className}
    >
      <div className="space-y-1 mt-1">
        {value.length === 0 && (
          <p className="text-[10px] font-mono text-zinc-600 italic px-1">No items yet.</p>
        )}

        {value.map((item, index) => {
          const isExpanded = expandedIndex === index
          const itemLabel = getItemLabel(item, subSchema, index)

          return (
            <div key={index} className="border border-zinc-800 rounded overflow-hidden">
              {/* Item header row */}
              <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="flex items-center gap-1 flex-1 text-left text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} item: ${itemLabel}`}
                >
                  {isExpanded ? (
                    <ChevronDown size={12} className="shrink-0 text-zinc-600" />
                  ) : (
                    <ChevronRight size={12} className="shrink-0 text-zinc-600" />
                  )}
                  <span className="truncate">{itemLabel}</span>
                </button>

                {/* Controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={disabled || index === 0}
                    className="p-0.5 text-zinc-600 hover:text-zinc-400 disabled:opacity-30 transition-colors"
                    aria-label={`Move item "${itemLabel}" up`}
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={disabled || index === value.length - 1}
                    className="p-0.5 text-zinc-600 hover:text-zinc-400 disabled:opacity-30 transition-colors"
                    aria-label={`Move item "${itemLabel}" down`}
                  >
                    <ArrowDown size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={disabled}
                    className="p-0.5 text-zinc-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                    aria-label={`Remove item "${itemLabel}"`}
                  >
                    <Trash size={11} />
                  </button>
                </div>
              </div>

              {/* Expanded sub-fields */}
              {isExpanded && (
                <div className="px-3 py-2 space-y-3 bg-zinc-950/40">
                  {subSchema.map(subDef => (
                    <div key={subDef.key}>
                      {renderSubField(
                        subDef,
                        item[subDef.key],
                        (val) => updateItem(index, { ...item, [subDef.key]: val }),
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Add button */}
        <button
          type="button"
          onClick={addItem}
          disabled={disabled}
          className="flex items-center gap-1 w-full mt-1 px-2 py-1.5 text-[10px] font-mono text-zinc-600 hover:text-zinc-400 border border-zinc-800 border-dashed rounded hover:border-zinc-600 transition-colors disabled:opacity-50"
          aria-label={`Add ${fieldDef.label} item`}
        >
          <Plus size={11} />
          Add {fieldDef.label.replace(/s$/, '')}
        </button>
      </div>
    </FieldWrapper>
  )
}

export default ArrayField
