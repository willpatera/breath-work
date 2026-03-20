const STORAGE_PREFIX = 'breathwork_'

export function loadBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return fallback
    return raw === 'true'
  } catch {
    return fallback
  }
}

export function saveBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, String(value))
  } catch {
    // Storage full or unavailable
  }
}
