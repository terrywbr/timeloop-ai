import seedRooms from '@/config/live_network.json'
import type { SupabaseClient } from '@supabase/supabase-js'

/** How the Live Network board is populated. */
export type LiveNetworkDataSource = 'seed' | 'live'

export type LiveNetworkRoomRow = {
  id: string
  icon: string
  title: string
  country_flag: string
  subtitle: string
  /** Current viewer count (real when dataSource=live). */
  viewerCount: number
  /** Streamer user id when live; null for seed placeholders. */
  streamerUserId?: string | null
  /** Link to ?stream=1 or public world when live. */
  streamUrl?: string | null
}

export type LiveNetworkPayload = {
  dataSource: LiveNetworkDataSource
  updatedAt: string
  rooms: LiveNetworkRoomRow[]
}

type SeedJsonFile = {
  _meta?: { purpose?: string; dataSource?: string }
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

function sortByViewersDesc(rooms: LiveNetworkRoomRow[]): LiveNetworkRoomRow[] {
  return [...rooms].sort((a, b) => b.viewerCount - a.viewerCount)
}

/** Placeholder seed rooms — shown until real streamers are live on the network. */
export function getSeedLiveNetworkRooms(): LiveNetworkRoomRow[] {
  const file = seedRooms as SeedJsonFile | SeedJsonRow[]
  const rows = Array.isArray(file) ? file : file.rooms
  return sortByViewersDesc(
    rows.map((row) => ({
      id: row.id,
      icon: row.icon,
      title: row.title,
      country_flag: row.country_flag,
      subtitle: row.subtitle,
      viewerCount: parseViewerCount(row.viewers),
      streamerUserId: null,
      streamUrl: null,
    })),
  )
}

/**
 * Live streamers ranked by concurrent viewers.
 * TODO: wire to streamer live-presence table / heartbeat when creators go on-air.
 */
export async function fetchLiveStreamerNetworkRooms(
  _supabase: SupabaseClient,
): Promise<LiveNetworkRoomRow[]> {
  void _supabase
  return []
}

function readDataSourceMode(): 'seed' | 'auto' | 'live' {
  const raw = process.env.LIVE_NETWORK_DATA_SOURCE?.trim().toLowerCase()
  if (raw === 'seed' || raw === 'live' || raw === 'auto') return raw
  return 'auto'
}

/** Resolve board payload: live ranked rooms when available, else seed placeholders. */
export async function resolveLiveNetworkPayload(
  supabase: SupabaseClient,
): Promise<LiveNetworkPayload> {
  const mode = readDataSourceMode()
  const updatedAt = new Date().toISOString()

  if (mode === 'seed') {
    return { dataSource: 'seed', updatedAt, rooms: getSeedLiveNetworkRooms() }
  }

  const liveRooms = sortByViewersDesc(await fetchLiveStreamerNetworkRooms(supabase))

  if (mode === 'live') {
    return { dataSource: 'live', updatedAt, rooms: liveRooms }
  }

  // auto — use live when any streamer is on-air, otherwise seed for early launch
  if (liveRooms.length > 0) {
    return { dataSource: 'live', updatedAt, rooms: liveRooms }
  }

  return { dataSource: 'seed', updatedAt, rooms: getSeedLiveNetworkRooms() }
}
