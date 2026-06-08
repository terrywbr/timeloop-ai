export function isStreamModeFromSearch(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get('stream') === '1'
}

export function readStreamModeFromWindow(): boolean {
  if (typeof window === 'undefined') return false
  return isStreamModeFromSearch(window.location.search)
}
