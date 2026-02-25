interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function testStorage(store: Storage): boolean {
  try {
    const key = '__storage_test__'
    store.setItem(key, key)
    store.removeItem(key)
    return true
  } catch {
    return false
  }
}

const memoryStore: Record<string, string> = {}

const memoryAdapter: StorageAdapter = {
  getItem: (key) => memoryStore[key] ?? null,
  setItem: (key, value) => { memoryStore[key] = value },
  removeItem: (key) => { delete memoryStore[key] },
}

function createStorageAdapter(): StorageAdapter {
  if (typeof window === 'undefined') return memoryAdapter

  if (testStorage(localStorage)) {
    return {
      getItem: (key) => {
        try { return localStorage.getItem(key) }
        catch { return memoryStore[key] ?? null }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value)
          memoryStore[key] = value
        } catch {
          memoryStore[key] = value
        }
      },
      removeItem: (key) => {
        try { localStorage.removeItem(key) }
        catch { /* noop */ }
        delete memoryStore[key]
      },
    }
  }

  if (testStorage(sessionStorage)) {
    return {
      getItem: (key) => sessionStorage.getItem(key),
      setItem: (key, value) => sessionStorage.setItem(key, value),
      removeItem: (key) => sessionStorage.removeItem(key),
    }
  }

  return memoryAdapter
}

export const storage = createStorageAdapter()
