import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('AdminShell resizable sidebar', () => {
  const source = readFileSync(
    resolve(import.meta.dirname, '../../app/admin/_components/AdminShell.tsx'),
    'utf8',
  )

  it('uses percentage or pixel strings for panel size constraints (not bare pixel numbers)', () => {
    expect(source).toMatch(/minSize="220px"/)
    expect(source).toMatch(/maxSize="36%"/)
    expect(source).toMatch(/defaultSize="20%"/)
    expect(source).toMatch(/minSize="50%"/)
    expect(source).not.toMatch(/minSize=\{14\}/)
    expect(source).not.toMatch(/maxSize=\{32\}/)
  })

  it('sanitizes stored layout percentages', () => {
    expect(source).toMatch(/sanitizeLayout/)
    expect(source).toMatch(/NAV_MIN_PERCENT/)
  })
})