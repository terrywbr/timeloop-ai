const STORAGE_KEY = 'timeloop-focus-guest'

export function getOrCreateFocusGuestId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return `guest-${Date.now()}`
  }
}
