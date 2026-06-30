import type { LiveNetworkDataSource, LiveNetworkRoomRow } from '@/lib/live-network-server'

export type { LiveNetworkDataSource, LiveNetworkRoomRow }

export type LiveNetworkClientPayload = {
  success: boolean
  dataSource?: LiveNetworkDataSource
  updatedAt?: string
  rooms?: LiveNetworkRoomRow[]
  error?: string
}

export const LIVE_NETWORK_POLL_MS = 45_000

/** Apply small random walk so seed counts feel live (not used for real dataSource=live). */
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

export async function fetchLiveNetworkBoard(): Promise<LiveNetworkClientPayload> {
  const response = await fetch('/api/live-network', { cache: 'no-store' })
  return (await response.json()) as LiveNetworkClientPayload
}

export { LIVE_NETWORK_HEARTBEAT_MS } from '@/lib/live-network-constants'
