import seedRooms from '@/config/live_network.json'
import { LIVE_NETWORK_DISPLAY_SLOTS } from '@/lib/live-network-constants'

export type LiveNetworkSeedRoom = {
  id: string
  icon: string
  title: string
  country_flag: string
  subtitle: string
  viewerCount: number
  isSeed: true
  streamerUserId: null
  streamUrl: null
}

type SeedJsonFile = {
  rooms: SeedJsonRow[]
}

type SeedJsonRow = {
  id: string
  icon: string
  title: string
  country_flag: string
  subtitle: string
  viewers: string
}

function parseViewerCount(raw: string): number {
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function readSeedRows(): SeedJsonRow[] {
  const file = seedRooms as SeedJsonFile | SeedJsonRow[]
  return Array.isArray(file) ? file : file.rooms
}

/** Seed rooms in config slot order (seed-1 … seed-6). Safe for client + server. */
export function getSeedRoomsInSlotOrder(): LiveNetworkSeedRoom[] {
  return readSeedRows().slice(0, LIVE_NETWORK_DISPLAY_SLOTS).map((row) => ({
    id: row.id,
    icon: row.icon,
    title: row.title,
    country_flag: row.country_flag,
    subtitle: row.subtitle,
    viewerCount: parseViewerCount(row.viewers),
    isSeed: true as const,
    streamerUserId: null,
    streamUrl: null,
  }))
}

/** Seed rooms sorted by viewer count for the all-placeholder board. */
export function getSeedLiveNetworkRooms(): LiveNetworkSeedRoom[] {
  return [...getSeedRoomsInSlotOrder()].sort((a, b) => b.viewerCount - a.viewerCount)
}
