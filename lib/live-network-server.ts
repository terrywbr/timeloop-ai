import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getSeedLiveNetworkRooms,
  getSeedRoomsInSlotOrder,
} from '@/lib/live-network-seed'
import {
  LIVE_NETWORK_DISPLAY_SLOTS,
  streamerPresenceCutoffIso,
  viewerPresenceCutoffIso,
} from '@/lib/live-network-constants'
import { hasStreamerPlanAccess } from '@/lib/supabase-server'
import type { UserProfile } from '@/lib/supabase-types'

/** How the Live Network board is populated. */
export type LiveNetworkDataSource = 'seed' | 'live' | 'mixed'

export type LiveNetworkRoomRow = {
  id: string
  icon: string
  title: string
  country_flag: string
  subtitle: string
  /** Current viewer count (real when dataSource=live). */
  viewerCount: number
  /** Seed placeholder row — not a real streamer. */
  isSeed?: boolean
  /** Streamer user id when live; null for seed placeholders. */
  streamerUserId?: string | null
  /** Link to ?stream=1&host= or public world when live. */
  streamUrl?: string | null
}

export type LiveNetworkPayload = {
  dataSource: LiveNetworkDataSource
  updatedAt: string
  rooms: LiveNetworkRoomRow[]
}

export type StreamerLivePresenceRow = {
  user_id: string
  room_name: string
  country_flag: string
  subtitle: string
  icon: string
  viewer_count: number
  last_seen_at: string
  updated_at: string
}

type PresenceWithUser = StreamerLivePresenceRow & {
  users:
    | Pick<
        UserProfile,
        | 'id'
        | 'plan'
        | 'vip_status'
        | 'vip_until'
        | 'display_name'
        | 'email'
        | 'lemon_squeezy_subscription_id'
        | 'lemon_squeezy_variant_id'
      >
    | Pick<
        UserProfile,
        | 'id'
        | 'plan'
        | 'vip_status'
        | 'vip_until'
        | 'display_name'
        | 'email'
        | 'lemon_squeezy_subscription_id'
        | 'lemon_squeezy_variant_id'
      >[]
    | null
}

function normalizePresenceUser(
  users: PresenceWithUser['users'],
): UserProfile | null {
  if (!users) return null
  const row = Array.isArray(users) ? users[0] : users
  if (!row) return null
  return row as UserProfile
}

function sortByViewersDesc(rooms: LiveNetworkRoomRow[]): LiveNetworkRoomRow[] {
  return [...rooms].sort((a, b) => b.viewerCount - a.viewerCount)
}

function resolvePublicSiteOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'https://app.timeloopai.net'
}

export function buildStreamerLiveStreamUrl(streamerUserId: string): string {
  const origin = resolvePublicSiteOrigin()
  const url = new URL('/', origin)
  url.searchParams.set('stream', '1')
  url.searchParams.set('host', streamerUserId)
  return url.toString()
}

export { getSeedLiveNetworkRooms } from '@/lib/live-network-seed'

/**
 * Fill up to `maxSlots` board rows: live streamers first (by viewers), then seed placeholders.
 * Real streamers replace seed slots from the top down as they join.
 */
export function mergeLiveNetworkBoard(
  liveRooms: LiveNetworkRoomRow[],
  maxSlots = LIVE_NETWORK_DISPLAY_SLOTS,
): LiveNetworkRoomRow[] {
  const live = sortByViewersDesc(liveRooms)
    .slice(0, maxSlots)
    .map((room) => ({ ...room, isSeed: false }))

  const seedSlotsNeeded = maxSlots - live.length
  if (seedSlotsNeeded <= 0) return live

  const fillers = getSeedRoomsInSlotOrder().slice(0, seedSlotsNeeded)
  return [...live, ...fillers]
}

function resolveBoardDataSource(rooms: LiveNetworkRoomRow[]): LiveNetworkDataSource {
  const liveCount = rooms.filter((room) => !room.isSeed).length
  if (liveCount === 0) return 'seed'
  if (liveCount >= rooms.length) return 'live'
  return 'mixed'
}

function countViewerSessions(rows: Array<{ streamer_user_id: string }>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.streamer_user_id, (counts.get(row.streamer_user_id) ?? 0) + 1)
  }
  return counts
}

/** Sync denormalized viewer_count on presence rows (best-effort). */
export async function syncStreamerViewerCounts(
  supabase: SupabaseClient,
  streamerUserIds: string[],
  counts: Map<string, number>,
) {
  if (streamerUserIds.length === 0) return

  await Promise.all(
    streamerUserIds.map(async (userId) => {
      const viewerCount = counts.get(userId) ?? 0
      const { error } = await supabase
        .from('streamer_live_presence')
        .update({ viewer_count: viewerCount })
        .eq('user_id', userId)
      if (error) {
        console.warn('[live-network] viewer_count sync failed', userId, error.message)
      }
    }),
  )
}

/** Count active viewer sessions for one streamer and update viewer_count. */
export async function refreshStreamerViewerCount(
  supabase: SupabaseClient,
  streamerUserId: string,
): Promise<number> {
  const viewerCutoff = viewerPresenceCutoffIso()

  const { count, error } = await supabase
    .from('streamer_live_viewers')
    .select('streamer_user_id', { count: 'exact', head: true })
    .eq('streamer_user_id', streamerUserId)
    .gte('last_seen_at', viewerCutoff)

  if (error) throw error

  const viewerCount = count ?? 0
  const { error: updateError } = await supabase
    .from('streamer_live_presence')
    .update({ viewer_count: viewerCount })
    .eq('user_id', streamerUserId)

  if (updateError) throw updateError
  return viewerCount
}

/**
 * Live streamers ranked by concurrent viewers.
 * Only includes streamers with an active heartbeat in the last 5 minutes and valid Streamer Pass.
 */
export async function fetchLiveStreamerNetworkRooms(
  supabase: SupabaseClient,
): Promise<LiveNetworkRoomRow[]> {
  const streamerCutoff = streamerPresenceCutoffIso()
  const viewerCutoff = viewerPresenceCutoffIso()

  const { data: presences, error } = await supabase
    .from('streamer_live_presence')
    .select(
      'user_id, room_name, country_flag, subtitle, icon, viewer_count, last_seen_at, updated_at, users ( id, plan, vip_status, vip_until, display_name, email, lemon_squeezy_subscription_id, lemon_squeezy_variant_id )',
    )
    .gte('last_seen_at', streamerCutoff)
    .order('last_seen_at', { ascending: false })

  if (error) throw error
  if (!presences?.length) return []

  const eligible = (presences as PresenceWithUser[]).filter((row) => {
    const profile = normalizePresenceUser(row.users)
    if (!profile) return false
    return hasStreamerPlanAccess(profile)
  })

  if (eligible.length === 0) return []

  const streamerUserIds = eligible.map((row) => row.user_id)

  const { data: viewerRows, error: viewerError } = await supabase
    .from('streamer_live_viewers')
    .select('streamer_user_id')
    .in('streamer_user_id', streamerUserIds)
    .gte('last_seen_at', viewerCutoff)

  if (viewerError) throw viewerError

  const viewerCounts = countViewerSessions(viewerRows ?? [])
  await syncStreamerViewerCounts(supabase, streamerUserIds, viewerCounts)

  const rooms: LiveNetworkRoomRow[] = eligible.map((row) => ({
    id: `live-${row.user_id}`,
    icon: row.icon || '🎧',
    title: row.room_name,
    country_flag: row.country_flag || '🌍',
    subtitle: row.subtitle || 'Live',
    viewerCount: viewerCounts.get(row.user_id) ?? 0,
    isSeed: false,
    streamerUserId: row.user_id,
    streamUrl: buildStreamerLiveStreamUrl(row.user_id),
  }))

  return sortByViewersDesc(rooms)
}

function readDataSourceMode(): 'seed' | 'auto' | 'live' {
  const raw = process.env.LIVE_NETWORK_DATA_SOURCE?.trim().toLowerCase()
  if (raw === 'seed' || raw === 'live' || raw === 'auto') return raw
  return 'auto'
}

/** Resolve board payload: live ranked rooms when available, else seed placeholders. */
export async function resolveLiveNetworkPayload(
  supabase: SupabaseClient | null,
): Promise<LiveNetworkPayload> {
  const mode = readDataSourceMode()
  const updatedAt = new Date().toISOString()

  if (mode === 'seed') {
    return { dataSource: 'seed', updatedAt, rooms: getSeedLiveNetworkRooms() }
  }

  let liveRooms: LiveNetworkRoomRow[] = []
  if (supabase) {
    try {
      liveRooms = await fetchLiveStreamerNetworkRooms(supabase)
    } catch (error) {
      console.warn('[live-network] live fetch failed, falling back to seed', error)
    }
  }

  if (mode === 'live') {
    const rooms = mergeLiveNetworkBoard(liveRooms)
    return {
      dataSource: resolveBoardDataSource(rooms),
      updatedAt,
      rooms,
    }
  }

  if (liveRooms.length > 0) {
    const rooms = mergeLiveNetworkBoard(liveRooms)
    return {
      dataSource: resolveBoardDataSource(rooms),
      updatedAt,
      rooms,
    }
  }

  return { dataSource: 'seed', updatedAt, rooms: getSeedLiveNetworkRooms() }
}
