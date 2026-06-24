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

// Global mock for @upstash/ratelimit — the test suite mocks @upstash/redis
// with a minimal class that only covers the methods needed by each test.
// The @upstash/ratelimit package internally uses redis pipeline/script methods
// that are not present on the test stub, which would cause the rate-limiter to
// fail-closed (503) for every request. This global mock replaces the package
// with a no-op version that always allows requests, matching the development
// behaviour when KV is unconfigured.
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() { return {} }
    async limit() { return { success: true } }
  },
}))
