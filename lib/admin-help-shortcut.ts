/** Keyboard shortcut label for admin help palette (client-safe). */
export function getAdminHelpShortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+K'
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘K' : 'Ctrl+K'
}