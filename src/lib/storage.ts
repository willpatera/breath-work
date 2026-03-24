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

export function loadNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return fallback
    const n = parseFloat(raw)
    return isNaN(n) ? fallback : n
  } catch {
    return fallback
  }
}

export function saveNumber(key: string, value: number): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, String(value))
  } catch {
    // Storage full or unavailable
  }
}
