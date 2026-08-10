/**
 * Coerce unknown values to a safe display string for public UI.
 * Non-strings (null, objects, etc.) become empty string so `.trim()` never throws.
 */
export function asDisplayString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  return ''
}
