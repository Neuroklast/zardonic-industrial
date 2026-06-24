import { describe, expect, it, vi } from 'vitest'
import { openAdminHelp } from '@/app/admin/_components/AdminHelpPalette'
import { getAdminHelpShortcutLabel } from '@/lib/admin-help-shortcut'

describe('openAdminHelp', () => {
  it('dispatches the admin help open event', () => {
    const handler = vi.fn()
    window.addEventListener('zardonic-admin-help-open', handler)
    openAdminHelp()
    expect(handler).toHaveBeenCalledTimes(1)
    window.removeEventListener('zardonic-admin-help-open', handler)
  })
})

describe('getAdminHelpShortcutLabel', () => {
  it('returns a keyboard shortcut label', () => {
    const label = getAdminHelpShortcutLabel()
    expect(['Ctrl+K', '⌘K']).toContain(label)
  })
})