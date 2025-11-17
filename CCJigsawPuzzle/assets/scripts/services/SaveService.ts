import { sys } from 'cc'

export function saveJSON(key: string, data: any) {
  try { sys.localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export function loadJSON<T = any>(key: string): T | null {
  try {
    const s = sys.localStorage.getItem(key)
    if (!s) return null
    return JSON.parse(s)
  } catch {
    return null
  }
}

export function remove(key: string) {
  try { sys.localStorage.removeItem(key) } catch {}
}