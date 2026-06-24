const STORAGE_PREFIX = 'zardonic.syncJob.'

export type SyncJobStorageKey = 'catalogue-sync' | 'data-maintenance' | 'gigs-sync'

function storageKey(key: SyncJobStorageKey): string {
  return `${STORAGE_PREFIX}${key}`
}

export function persistSyncJobId(key: SyncJobStorageKey, jobId: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(storageKey(key), jobId)
  } catch {
    // ignore quota / private mode
  }
}

export function readPersistedSyncJobId(key: SyncJobStorageKey): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(storageKey(key))
  } catch {
    return null
  }
}

export function clearPersistedSyncJobId(key: SyncJobStorageKey): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(storageKey(key))
  } catch {
    // ignore
  }
}