interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

interface StorageHealth {
  localStorage: boolean
  isPrivate: boolean
}

function testStoragePersistence(store: Storage): boolean {
  try {
    const key = '__storage_test_' + Date.now()
    store.setItem(key, 'test')
    const result = store.getItem(key)
    store.removeItem(key)
    return result === 'test'
  } catch {
    return false
  }
}

function detectPrivateBrowsing(): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem('__private_test__', '1')
    localStorage.removeItem('__private_test__')
    return false
  } catch {
    return true
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

  const isPrivate = detectPrivateBrowsing()
  const hasLocalStorage = !isPrivate && testStoragePersistence(localStorage)

  if (hasLocalStorage) {
    return {
      getItem: (key) => {
        try {
          return localStorage.getItem(key) ?? memoryStore[key] ?? null
        } catch {
          return memoryStore[key] ?? null
        }
      },
      setItem: (key, value) => {
        memoryStore[key] = value
        try { localStorage.setItem(key, value) }
        catch { /* memoryStore already updated */ }
      },
      removeItem: (key) => {
        delete memoryStore[key]
        try { localStorage.removeItem(key) }
        catch { /* noop */ }
      },
    }
  }

  return memoryAdapter
}

export const storage = createStorageAdapter()

export function checkStorageHealth(): StorageHealth {
  const isPrivate = detectPrivateBrowsing()
  return {
    localStorage: !isPrivate && testStoragePersistence(localStorage),
    isPrivate,
  }
}
