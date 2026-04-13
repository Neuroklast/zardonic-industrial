/**
 * useAdminKeyboardShortcuts
 *
 * Registers global keyboard shortcuts for the admin shell.
 * Attach inside `AdminSectionEditor` or `AdminShell` to enable shortcuts.
 *
 * Supported shortcuts:
 *   - Ctrl+S / Cmd+S   → onSave (prevents browser save dialog)
 *   - Ctrl+Z / Cmd+Z   → onUndo
 *   - Ctrl+Shift+Z / Ctrl+Y / Cmd+Shift+Z → onRedo
 *   - Escape            → onEscape (e.g., close menus, disclosure dropdowns)
 *
 * Usage:
 * ```ts
 * useAdminKeyboardShortcuts({
 *   onSave: handleSave,
 *   onUndo: handleUndo,
 *   onRedo: handleRedo,
 *   onEscape: () => setMenuOpen(false),
 * })
 * ```
 */

import { useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminKeyboardShortcutsOptions {
  /** Ctrl+S / Cmd+S — save the current section. */
  onSave?: () => void
  /** Ctrl+Z / Cmd+Z — undo the last change. */
  onUndo?: () => void
  /** Ctrl+Shift+Z / Ctrl+Y / Cmd+Shift+Z — redo the last undone change. */
  onRedo?: () => void
  /** Escape — dismiss open menus or reset focus. */
  onEscape?: () => void
  /** Set to false to temporarily disable all shortcuts (e.g., during a modal). */
  enabled?: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Registers keyboard shortcuts on the document.
 * Handlers are stable references — no need to memoize outside.
 */
export function useAdminKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onEscape,
  enabled = true,
}: AdminKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.startsWith('Mac')
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd+S — Save
      if (ctrlOrMeta && !e.shiftKey && e.key === 's') {
        e.preventDefault()
        onSave?.()
        return
      }

      // Ctrl/Cmd+Z — Undo (must be checked before Ctrl+Shift+Z / Redo)
      if (ctrlOrMeta && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        onUndo?.()
        return
      }

      // Ctrl/Cmd+Shift+Z or Ctrl+Y — Redo
      if (ctrlOrMeta && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        onRedo?.()
        return
      }
      if (e.ctrlKey && !e.shiftKey && e.key === 'y') {
        e.preventDefault()
        onRedo?.()
        return
      }

      // Escape
      if (e.key === 'Escape') {
        onEscape?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onSave, onUndo, onRedo, onEscape])
}
