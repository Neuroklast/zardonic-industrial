import '@testing-library/jest-dom/vitest'

/**
 * Node 22+ exposes a partial `localStorage` when `--localstorage-file` is unset.
 * Vitest/jsdom tests need a full Storage implementation (clear, setItem, …).
 */
function createStorageMock(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

const storageMock = createStorageMock()
Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
  configurable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: createStorageMock(),
  writable: true,
  configurable: true,
})

beforeEach(() => {
  storageMock.clear()
})
