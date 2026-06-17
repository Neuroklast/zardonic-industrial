import type { StorageProvider } from './types'
import { r2StorageProvider } from './r2'

export type { StorageProvider, StorageObject } from './types'

let _instance: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (_instance) return _instance
  _instance = r2StorageProvider
  return _instance
}

export function _resetStorageProvider(): void {
  _instance = null
}
