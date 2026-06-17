/**
 * Field Components — Barrel Export
 *
 * Exports all reusable admin field components and the field type → component mapping.
 *
 * Usage:
 * ```typescript
 * import { FIELD_COMPONENT_MAP, TextField, ArrayField } from '@/cms/components/fields'
 * ```
 */

export { FieldWrapper } from './FieldWrapper'
export type { FieldWrapperProps } from './FieldWrapper'

export { TextField } from './TextField'
export type { TextFieldProps } from './TextField'

export { TextAreaField } from './TextAreaField'
export type { TextAreaFieldProps } from './TextAreaField'

export { NumberField } from './NumberField'
export type { NumberFieldProps } from './NumberField'

export { BooleanField } from './BooleanField'
export type { BooleanFieldProps } from './BooleanField'

export { SelectField } from './SelectField'
export type { SelectFieldProps } from './SelectField'

export { DateField } from './DateField'
export type { DateFieldProps } from './DateField'

export { ColorField } from './ColorField'
export type { ColorFieldProps } from './ColorField'

export { ImageField } from './ImageField'
export type { ImageFieldProps } from './ImageField'

export { UrlField } from './UrlField'
export type { UrlFieldProps } from './UrlField'

export { ArrayField } from './ArrayField'
export type { ArrayFieldProps } from './ArrayField'

export { ObjectField } from './ObjectField'
export type { ObjectFieldProps } from './ObjectField'

import type { AdminFieldType } from '@/lib/admin-section-schema'

/**
 * Maps `AdminFieldType` values to the corresponding field component name.
 * Used by `SectionEditorFactory` to dispatch rendering.
 */
export const FIELD_TYPE_NAMES: Record<AdminFieldType, string> = {
  text: 'TextField',
  textarea: 'TextAreaField',
  richtext: 'TextAreaField', // Falls back to TextAreaField; swap for RichTextEditor in future
  number: 'NumberField',
  boolean: 'BooleanField',
  select: 'SelectField',
  date: 'DateField',
  color: 'ColorField',
  image: 'ImageField',
  url: 'UrlField',
  array: 'ArrayField',
  object: 'ObjectField',
}
