import { describe, it, expect, beforeEach } from 'vitest'
import {
  getActivityLog,
  logActivity,
  clearActivityLog,
  ACTION_LABELS,
  type ActivityLogAction,
} from '@/lib/activity-log'

// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
describe('logActivity()', () => {
  it('adds an entry to localStorage', () => {
    logActivity('login-success', 'User logged in')
    const log = getActivityLog()
    expect(log).toHaveLength(1)
    expect(log[0].action).toBe('login-success')
    expect(log[0].detail).toBe('User logged in')
    expect(log[0].id).toBeTruthy()
    expect(log[0].timestamp).toBeTruthy()
  })

  it('stores optional meta data', () => {
    logActivity('config-change', 'Updated title', { field: 'siteName' })
    const log = getActivityLog()
    expect(log[0].meta).toEqual({ field: 'siteName' })
  })

  it('prepends newest entries first', () => {
    logActivity('login-success', 'First')
    logActivity('logout', 'Second')
    const log = getActivityLog()
    expect(log[0].action).toBe('logout')
    expect(log[1].action).toBe('login-success')
  })
})

// ---------------------------------------------------------------------------
describe('getActivityLog()', () => {
  it('returns empty array when no entries exist', () => {
    expect(getActivityLog()).toEqual([])
  })

  it('returns entries newest first', () => {
    logActivity('login-success', 'One')
    logActivity('login-failure', 'Two')
    logActivity('logout', 'Three')
    const log = getActivityLog()
    expect(log[0].action).toBe('logout')
    expect(log[2].action).toBe('login-success')
  })
})

// ---------------------------------------------------------------------------
describe('clearActivityLog()', () => {
  it('removes all entries', () => {
    logActivity('login-success', 'entry')
    clearActivityLog()
    expect(getActivityLog()).toEqual([])
  })

  it('does not throw on empty log', () => {
    expect(() => clearActivityLog()).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
describe('MAX_ENTRIES cap', () => {
  it('caps at 200 entries', () => {
    for (let i = 0; i < 210; i++) {
      logActivity('config-change', `Entry ${i}`)
    }
    const log = getActivityLog()
    expect(log.length).toBe(200)
    // Newest entry should be last one added
    expect(log[0].detail).toBe('Entry 209')
  })
})

// ---------------------------------------------------------------------------
describe('ACTION_LABELS', () => {
  const expectedKeys: ActivityLogAction[] = [
    'theme-change',
    'config-change',
    'login-attempt',
    'login-success',
    'login-failure',
    'logout',
    'section-toggle',
    'widget-install',
    'widget-uninstall',
    'widget-toggle',
    'password-change',
    'setup-reset',
    'export-config',
    'import-config',
  ]

  it('has all expected keys', () => {
    for (const key of expectedKeys) {
      expect(ACTION_LABELS).toHaveProperty(key)
      expect(typeof ACTION_LABELS[key]).toBe('string')
    }
  })

  it('has no extra keys', () => {
    expect(Object.keys(ACTION_LABELS).sort()).toEqual(expectedKeys.sort())
  })
})
