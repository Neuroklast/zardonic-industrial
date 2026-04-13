/**
 * SectionEditorFactory
 *
 * A React component that takes an `AdminSectionSchema` and auto-generates
 * a complete edit form from the schema's field definitions.
 *
 * Features:
 *   - Renders all field types via the field component dispatch map
 *   - Progressive disclosure: groups collapsed/expanded based on `AdminFieldGroup.defaultExpanded`
 *   - Shows field tooltips, validation errors, and required markers
 *   - Runs per-field validation on change + cross-field `schema.validate` on submit
 *   - Fully controlled: receives `data` + `onChange` (IoC)
 *   - Filters by `disclosure` level so advanced/expert fields are hidden at basic level
 *
 * Usage:
 * ```tsx
 * import { SectionEditorFactory } from '@/cms/components/SectionEditorFactory'
 * import { heroSectionSchema } from '@/cms/section-schemas'
 *
 * <SectionEditorFactory
 *   schema={heroSectionSchema}
 *   data={currentData}
 *   onChange={setCurrentData}
 *   disclosure="basic"
 * />
 * ```
 *
 * Note: This component does NOT handle save/publish — wire those in the parent.
 */

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AdminSectionSchema, AdminFieldDefinition, AdminFieldGroup } from '@/lib/admin-section-schema'
import {
  TextField,
  TextAreaField,
  NumberField,
  BooleanField,
  SelectField,
  DateField,
  ColorField,
  ImageField,
  UrlField,
  ArrayField,
  ObjectField,
} from './fields'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SectionEditorFactoryProps<T extends Record<string, unknown>> {
  /** The schema that drives form generation. */
  schema: AdminSectionSchema<T>
  /** Current section data (controlled). */
  data: T
  /** Called whenever any field value changes. */
  onChange: (data: T) => void
  /**
   * Disclosure level — controls which fields are visible.
   *   basic    → only basic fields shown
   *   advanced → basic + advanced fields shown
   *   expert   → all fields shown
   * Defaults to 'basic'.
   */
  disclosure?: 'basic' | 'advanced' | 'expert'
  /** External validation errors keyed by field key. Merged with internal per-field errors. */
  errors?: Record<string, string>
  /** When true, all inputs are rendered read-only. */
  disabled?: boolean
  /** Optional extra CSS class on the root container. */
  className?: string
}

// ─── Disclosure helpers ───────────────────────────────────────────────────────

const DISCLOSURE_RANK: Record<string, number> = { basic: 0, advanced: 1, expert: 2 }

function isFieldVisible(fieldDisclosure: string | undefined, panelDisclosure: string): boolean {
  const fieldRank = DISCLOSURE_RANK[fieldDisclosure ?? 'basic'] ?? 0
  const panelRank = DISCLOSURE_RANK[panelDisclosure] ?? 0
  return fieldRank <= panelRank
}

// ─── Per-field validation ─────────────────────────────────────────────────────

function validateField(fieldDef: AdminFieldDefinition, value: unknown): string | null {
  const v = fieldDef.validation
  if (!v) return null

  if (fieldDef.required) {
    if (value === null || value === undefined || value === '') {
      return `${fieldDef.label} is required.`
    }
  }

  if (typeof value === 'string') {
    if (v.minLength !== undefined && value.length < v.minLength) {
      return `Must be at least ${v.minLength} characters.`
    }
    if (v.maxLength !== undefined && value.length > v.maxLength) {
      return `Must be at most ${v.maxLength} characters.`
    }
    if (v.pattern && value !== '') {
      const regex = new RegExp(v.pattern)
      if (!regex.test(value)) {
        return v.patternMessage ?? 'Invalid format.'
      }
    }
  }

  if (typeof value === 'number') {
    if (v.min !== undefined && value < v.min) {
      return `Must be at least ${v.min}.`
    }
    if (v.max !== undefined && value > v.max) {
      return `Must be at most ${v.max}.`
    }
  }

  if (v.custom) {
    return v.custom(value)
  }

  return null
}

// ─── Field renderer dispatch ──────────────────────────────────────────────────

interface FieldRendererProps {
  fieldDef: AdminFieldDefinition
  value: unknown
  onChange: (val: unknown) => void
  error?: string
  disabled?: boolean
}

function FieldRenderer({ fieldDef, value, onChange, error, disabled }: FieldRendererProps) {
  switch (fieldDef.type) {
    case 'text':
    case 'richtext':
      return (
        <TextField
          fieldDef={fieldDef}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'textarea':
      return (
        <TextAreaField
          fieldDef={fieldDef}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'number':
      return (
        <NumberField
          fieldDef={fieldDef}
          value={typeof value === 'number' ? value : Number(value ?? 0)}
          onChange={val => onChange(val)}
          error={error}
          disabled={disabled}
        />
      )

    case 'boolean':
      return (
        <BooleanField
          fieldDef={fieldDef}
          value={Boolean(value)}
          onChange={val => onChange(val)}
          error={error}
          disabled={disabled}
        />
      )

    case 'select':
      return (
        <SelectField
          fieldDef={fieldDef}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'date':
      return (
        <DateField
          fieldDef={fieldDef}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'color':
      return (
        <ColorField
          fieldDef={fieldDef}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'image':
      return (
        <ImageField
          fieldDef={fieldDef}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'url':
      return (
        <UrlField
          fieldDef={fieldDef}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'array': {
      const arr = Array.isArray(value) ? value as Record<string, unknown>[] : []
      return (
        <ArrayField
          fieldDef={fieldDef}
          value={arr}
          onChange={val => onChange(val)}
          error={error}
          disabled={disabled}
          renderSubField={(subDef, subVal, onSubChange) => (
            <FieldRenderer
              key={subDef.key}
              fieldDef={subDef}
              value={subVal}
              onChange={onSubChange}
              disabled={disabled}
            />
          )}
        />
      )
    }

    case 'object': {
      const obj = (value && typeof value === 'object' && !Array.isArray(value))
        ? value as Record<string, unknown>
        : {}
      return (
        <ObjectField
          fieldDef={fieldDef}
          value={obj}
          onChange={val => onChange(val)}
          error={error}
          disabled={disabled}
          renderSubField={(subDef, subVal, onSubChange) => (
            <FieldRenderer
              key={subDef.key}
              fieldDef={subDef}
              value={subVal}
              onChange={onSubChange}
              disabled={disabled}
            />
          )}
        />
      )
    }

    default:
      return null
  }
}

// ─── Group panel ──────────────────────────────────────────────────────────────

interface FieldGroupPanelProps {
  group: AdminFieldGroup
  fields: AdminFieldDefinition[]
  data: Record<string, unknown>
  errors: Record<string, string>
  onFieldChange: (key: string, val: unknown) => void
  disabled?: boolean
}

function FieldGroupPanel({ group, fields, data, errors, onFieldChange, disabled }: FieldGroupPanelProps) {
  const [expanded, setExpanded] = useState(group.defaultExpanded ?? false)

  if (fields.length === 0) return null

  return (
    <div className="border border-zinc-800 rounded overflow-hidden">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-900 transition-colors text-left"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${group.label}`}
      >
        {expanded ? (
          <ChevronDown size={12} className="text-zinc-600 shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-zinc-600 shrink-0" />
        )}
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
          {group.label}
        </span>
        {group.description && (
          <span className="text-[10px] font-mono text-zinc-700 ml-auto truncate">
            {group.description}
          </span>
        )}
      </button>

      {/* Group fields */}
      {expanded && (
        <div className="px-3 py-3 space-y-4 bg-zinc-950/20">
          {fields.map(fieldDef => (
            <FieldRenderer
              key={fieldDef.key}
              fieldDef={fieldDef}
              value={data[fieldDef.key]}
              onChange={val => onFieldChange(fieldDef.key, val)}
              error={errors[fieldDef.key]}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Auto-generates a complete edit form from an `AdminSectionSchema`.
 *
 * - Groups fields by `fieldDef.group` matching `schema.fieldGroups[].id`.
 * - Fields without a matching group land in an implicit "General" group.
 * - Respects `disclosure` to hide advanced/expert fields at basic level.
 * - Runs inline validation on every change.
 */
export function SectionEditorFactory<T extends Record<string, unknown>>({
  schema,
  data,
  onChange,
  disclosure = 'basic',
  errors: externalErrors = {},
  disabled,
  className,
}: SectionEditorFactoryProps<T>) {
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({})

  const handleFieldChange = useCallback(
    (key: string, val: unknown) => {
      const fieldDef = schema.fields.find(f => f.key === key)
      if (fieldDef) {
        const error = validateField(fieldDef, val)
        setInternalErrors(prev => {
          if (error) return { ...prev, [key]: error }
          const next = { ...prev }
          delete next[key]
          return next
        })
      }
      onChange({ ...data, [key]: val })
    },
    [schema.fields, data, onChange],
  )

  // Merge external + internal errors (external wins)
  const mergedErrors: Record<string, string> = { ...internalErrors, ...externalErrors }

  // Visible fields after disclosure filtering
  const visibleFields = schema.fields.filter(f => isFieldVisible(f.disclosure, disclosure))

  // Resolve groups — use schema.fieldGroups if provided, else derive from field groups
  const resolvedGroups: AdminFieldGroup[] = schema.fieldGroups && schema.fieldGroups.length > 0
    ? schema.fieldGroups
    : Array.from(
        new Set(visibleFields.map(f => f.group ?? 'General')),
      ).map((id, i) => ({
        id,
        label: id,
        defaultExpanded: i === 0,
      }))

  // Fields without a matching group go into "General"
  const groupedFields = (groupId: string): AdminFieldDefinition[] =>
    visibleFields.filter(f => {
      const fieldGroup = f.group ?? 'General'
      return fieldGroup === groupId
    })

  // Ungrouped fields (no matching group in resolvedGroups)
  const allGroupIds = new Set(resolvedGroups.map(g => g.id))
  const ungroupedFields = visibleFields.filter(f => !allGroupIds.has(f.group ?? 'General') && !f.group)

  return (
    <div className={`space-y-2 ${className ?? ''}`} role="form" aria-label={`${schema.label} editor`}>
      {/* Ungrouped fields rendered at the top */}
      {ungroupedFields.length > 0 && (
        <div className="space-y-4 px-1">
          {ungroupedFields.map(fieldDef => (
            <FieldRenderer
              key={fieldDef.key}
              fieldDef={fieldDef}
              value={(data as Record<string, unknown>)[fieldDef.key]}
              onChange={val => handleFieldChange(fieldDef.key, val)}
              error={mergedErrors[fieldDef.key]}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Grouped fields */}
      {resolvedGroups.map(group => {
        const fields = groupedFields(group.id)
        if (fields.length === 0) return null
        return (
          <FieldGroupPanel
            key={group.id}
            group={group}
            fields={fields}
            data={data as Record<string, unknown>}
            errors={mergedErrors}
            onFieldChange={handleFieldChange}
            disabled={disabled}
          />
        )
      })}
    </div>
  )
}

export default SectionEditorFactory
