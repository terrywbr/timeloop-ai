import liveNetworkData from '@/config/live_network.json'

export type LiveNetworkRoom = {
  id: string
  icon: string
  title: string
  country_flag: string
  subtitle: string
  viewers: string
}

export const LIVE_NETWORK_ROOMS: LiveNetworkRoom[] = liveNetworkData

export function parseViewerBase(viewers: string): number {
  const parsed = Number.parseInt(viewers, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/** Apply small random walk so counts feel live (clamped around base). */
export function fluctuateViewerCount(current: number, base: number): number {
  const delta = Math.floor(Math.random() * 9) - 4
  const min = Math.max(1, Math.floor(base * 0.82))
  const max = Math.ceil(base * 1.18)
  return Math.min(max, Math.max(min, current + delta))
}

export function isLiveNetworkHiddenFromSearch(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get('hidenetwork') === '1'
}

export function readLiveNetworkHiddenFromWindow(): boolean {
  if (typeof window === 'undefined') return false
  return isLiveNetworkHiddenFromSearch(window.location.search)
}
