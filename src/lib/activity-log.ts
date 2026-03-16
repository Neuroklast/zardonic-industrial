/**
 * Activity Log — records admin actions for audit purposes.
 * Entries are stored in localStorage under 'kv:activity-log'.
 * The log is capped at MAX_ENTRIES to prevent unbounded growth.
 */

export type ActivityLogAction =
  | 'theme-change'
  | 'config-change'
  | 'login-attempt'
  | 'login-success'
  | 'login-failure'
  | 'logout'
  | 'section-toggle'
  | 'widget-install'
  | 'widget-uninstall'
  | 'widget-toggle'
  | 'password-change'
  | 'setup-reset'
  | 'export-config'
  | 'import-config'

export interface ActivityLogEntry {
  id: string
  action: ActivityLogAction
  detail: string
  timestamp: string
  meta?: Record<string, unknown>
}

const STORAGE_KEY = 'kv:activity-log'
const MAX_ENTRIES = 200

export function getActivityLog(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ActivityLogEntry[]
  } catch {
    return []
  }
}

export function logActivity(
  action: ActivityLogAction,
  detail: string,
  meta?: Record<string, unknown>,
): void {
  try {
    const existing = getActivityLog()
    const entry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      action,
      detail,
      timestamp: new Date().toISOString(),
      meta,
    }
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Storage not available — silently ignore
  }
}

export function clearActivityLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export const ACTION_LABELS: Record<ActivityLogAction, string> = {
  'theme-change': 'Theme Changed',
  'config-change': 'Config Changed',
  'login-attempt': 'Login Attempt',
  'login-success': 'Login Success',
  'login-failure': 'Login Failure',
  'logout': 'Logout',
  'section-toggle': 'Section Toggled',
  'widget-install': 'Widget Installed',
  'widget-uninstall': 'Widget Uninstalled',
  'widget-toggle': 'Widget Toggled',
  'password-change': 'Password Changed',
  'setup-reset': 'Setup Reset',
  'export-config': 'Config Exported',
  'import-config': 'Config Imported',
}
