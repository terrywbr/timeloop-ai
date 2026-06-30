import type { CheckoutProductKind } from '@/lib/billing-config'
import type { CreatorProfile, GalleryWorld, PublicWorldsSort } from '@/lib/community/types'
import type { MusicMoodId } from '@/lib/music-moods'
import type { PublicGeneratedWorld } from './supabase-types'

export type UserAccountProfile = {
  id: string
  email: string | null
  displayName: string | null
  plan: 'free' | 'vip' | 'streamer'
  vipStatus: string
  vipUntil: string | null
  isVip: boolean
  /** Plan-level streamer flag only (no VIP fallback). */
  isStreamer: boolean
  isStreamerPlan: boolean
  hasCreatorTools: boolean
  hasUnlimitedGeneration: boolean
  hasDownloadAccess: boolean
  remainingCredits: number
  monthlyGenerationLimit: number
  creditsResetAt: string
  streamerMonthlyQuotaImages?: number
  streamerUsedImages?: number
  streamerRemainingImages?: number
  isFoundingCreator?: boolean
  foundingEnrolledAt?: string | null
}

export type StreamerScenePackItem = {
  id: string
  imageUrl: string
  sortOrder: number
  durationSec: number
}

export type StreamerScenePack = {
  id: string
  name: string
  moodId: string
  status: 'draft' | 'active' | 'archived'
  isLoop: boolean
  playOrder: 'sequential' | 'random'
  createdAt: string
  updatedAt: string
  items: StreamerScenePackItem[]
}

type ApiErrorResponse = {
  success: false
  error: string
}

function authHeaders(accessToken: string | null | undefined, extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return headers
}

export async function fetchUserProfile(accessToken: string): Promise<UserAccountProfile | null> {
  const response = await fetch('/api/me', {
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true; profile: UserAccountProfile } | ApiErrorResponse
  if (!response.ok || !payload.success) return null
  return payload.profile
}

export async function fetchWorlds(accessToken?: string | null): Promise<{
  featured: PublicGeneratedWorld[]
  own: PublicGeneratedWorld[]
}> {
  const response = await fetch('/api/worlds', {
    headers: authHeaders(accessToken ?? null),
  })
  const payload = (await response.json()) as
    | { success: true; featured: PublicGeneratedWorld[]; own: PublicGeneratedWorld[] }
    | ApiErrorResponse

  if (!response.ok || !payload.success) {
    return { featured: [], own: [] }
  }

  return {
    featured: payload.featured,
    own: payload.own,
  }
}

export async function fetchPublicWorlds(
  options: {
    sort?: PublicWorldsSort
    cursor?: string | null
    limit?: number
    accessToken?: string | null
  } = {},
): Promise<{ worlds: GalleryWorld[]; nextCursor: string | null }> {
  const params = new URLSearchParams()
  if (options.sort) params.set('sort', options.sort)
  if (options.cursor) params.set('cursor', options.cursor)
  if (options.limit) params.set('limit', String(options.limit))

  const response = await fetch(`/api/worlds/public?${params.toString()}`, {
    headers: authHeaders(options.accessToken ?? null),
  })
  const payload = (await response.json()) as
    | { success: true; worlds: GalleryWorld[]; nextCursor: string | null }
    | ApiErrorResponse

  if (!response.ok || !payload.success) {
    return { worlds: [], nextCursor: null }
  }

  return { worlds: payload.worlds, nextCursor: payload.nextCursor }
}

export async function fetchWorldById(
  worldId: string,
  accessToken?: string | null,
): Promise<GalleryWorld | null> {
  const response = await fetch(`/api/worlds/${worldId}`, {
    headers: authHeaders(accessToken ?? null),
  })
  const payload = (await response.json()) as { success: true; world: GalleryWorld } | ApiErrorResponse
  if (!response.ok || !payload.success) return null
  return payload.world
}

export async function publishWorld(
  accessToken: string,
  worldId: string,
  data: {
    isPublic: boolean
    title?: string
    description?: string
    moodId?: MusicMoodId
    tags?: string[]
  },
): Promise<GalleryWorld> {
  const response = await fetch(`/api/worlds/${worldId}/publish`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(data),
  })
  const payload = (await response.json()) as { success: true; world: GalleryWorld } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Publish failed' : payload.error)
  }
  return payload.world
}

export async function recordWorldView(worldId: string) {
  await fetch(`/api/worlds/${worldId}/view`, { method: 'POST' })
}

export async function toggleWorldLike(
  accessToken: string,
  worldId: string,
  liked: boolean,
): Promise<void> {
  const response = await fetch(`/api/worlds/${worldId}/like`, {
    method: liked ? 'POST' : 'DELETE',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Like failed' : payload.error)
  }
}

export async function toggleWorldSave(
  accessToken: string,
  worldId: string,
  saved: boolean,
): Promise<void> {
  const response = await fetch(`/api/worlds/${worldId}/save`, {
    method: saved ? 'POST' : 'DELETE',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Save failed' : payload.error)
  }
}

export async function fetchCreatorProfile(
  userId: string,
  accessToken?: string | null,
): Promise<CreatorProfile | null> {
  const response = await fetch(`/api/users/${userId}/profile`, {
    headers: authHeaders(accessToken ?? null),
  })
  const payload = (await response.json()) as { success: true; profile: CreatorProfile } | ApiErrorResponse
  if (!response.ok || !payload.success) return null
  return payload.profile
}

export async function toggleFollowUser(
  accessToken: string,
  userId: string,
  following: boolean,
): Promise<void> {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: following ? 'POST' : 'DELETE',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Follow failed' : payload.error)
  }
}

export async function submitWorldReport(
  accessToken: string,
  worldId: string,
  reason: string,
): Promise<void> {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ worldId, reason }),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Report failed' : payload.error)
  }
}

export async function sendFocusHeartbeat(
  worldId: string,
  options?: { accessToken?: string | null; guestId?: string },
) {
  await fetch('/api/focus/heartbeat', {
    method: 'POST',
    headers: authHeaders(options?.accessToken ?? null, options?.guestId ? { 'x-focus-guest': options.guestId } : undefined),
    body: JSON.stringify({ worldId }),
  })
}

export async function leaveFocusSession(
  worldId: string,
  options?: { accessToken?: string | null; guestId?: string },
) {
  const params = new URLSearchParams({ worldId })
  await fetch(`/api/focus/heartbeat?${params.toString()}`, {
    method: 'DELETE',
    headers: authHeaders(options?.accessToken ?? null, options?.guestId ? { 'x-focus-guest': options.guestId } : undefined),
  })
}

export async function fetchFocusPresence(worldId: string): Promise<number> {
  const params = new URLSearchParams({ worldId })
  const response = await fetch(`/api/focus/presence?${params.toString()}`)
  const payload = (await response.json()) as { success: true; count: number } | ApiErrorResponse
  if (!response.ok || !payload.success) return 0
  return payload.count
}

export async function sendStreamerLiveHeartbeat(
  accessToken: string,
  input: {
    roomName?: string
    subtitle?: string
    countryFlag?: string
    icon?: string
  },
): Promise<void> {
  const response = await fetch('/api/live-network/streamer-heartbeat', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Streamer heartbeat failed' : payload.error)
  }
}

export async function leaveStreamerLiveHeartbeat(accessToken: string): Promise<void> {
  await fetch('/api/live-network/streamer-heartbeat', {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
}

export async function sendLiveNetworkViewerHeartbeat(
  streamerUserId: string,
  options?: { accessToken?: string | null; guestId?: string },
): Promise<void> {
  await fetch('/api/live-network/viewer-heartbeat', {
    method: 'POST',
    headers: authHeaders(
      options?.accessToken ?? null,
      options?.guestId ? { 'x-live-network-guest': options.guestId } : undefined,
    ),
    body: JSON.stringify({ streamerUserId }),
  })
}

export async function leaveLiveNetworkViewerHeartbeat(
  streamerUserId: string,
  options?: { accessToken?: string | null; guestId?: string },
): Promise<void> {
  const params = new URLSearchParams({ streamerUserId })
  await fetch(`/api/live-network/viewer-heartbeat?${params.toString()}`, {
    method: 'DELETE',
    headers: authHeaders(
      options?.accessToken ?? null,
      options?.guestId ? { 'x-live-network-guest': options.guestId } : undefined,
    ),
  })
}

export type CheckoutKind = CheckoutProductKind | 'subscription'

export async function startCheckout(
  accessToken: string,
  kind: CheckoutKind,
): Promise<string | null> {
  const normalized = kind === 'subscription' ? 'vip' : kind
  const response = await fetch('/api/checkout/lemonsqueezy', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ kind: normalized }),
  })
  const payload = (await response.json()) as { success: true; checkoutUrl: string } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Checkout failed' : payload.error
    throw new Error(message)
  }
  return payload.checkoutUrl
}

export async function downloadBackgroundImage(
  accessToken: string,
  imageUrl: string,
  filename: string,
): Promise<Blob> {
  const response = await fetch('/api/download/background', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ imageUrl, filename }),
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(payload?.error ?? 'Download failed')
  }
  return response.blob()
}

export async function fetchStreamerSettings(accessToken: string) {
  const response = await fetch('/api/streamer/settings', {
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true; settings: unknown } | ApiErrorResponse
  if (!response.ok || !payload.success) return null
  return payload.settings
}

export async function fetchStreamerBackgrounds(accessToken: string) {
  const response = await fetch('/api/streamer/backgrounds', {
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as
    | { success: true; backgrounds: Array<{ id: string; public_url: string; sort_order: number }> }
    | ApiErrorResponse
  if (!response.ok || !payload.success) return []
  return payload.backgrounds
}

export async function uploadStreamerBackground(accessToken: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/streamer/backgrounds', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })
  const payload = (await response.json()) as
    | { success: true; background: { id: string; public_url: string; sort_order: number } }
    | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Upload failed' : payload.error
    throw new Error(message)
  }
  return payload.background
}

export async function addGeneratedStreamerBackground(accessToken: string, imageUrl: string) {
  const response = await fetch('/api/streamer/backgrounds', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ imageUrl }),
  })
  const payload = (await response.json()) as
    | { success: true; background: { id: string; public_url: string; sort_order: number } }
    | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Add generated background failed' : payload.error
    throw new Error(message)
  }
  return payload.background
}

export async function deleteStreamerBackground(accessToken: string, id: string) {
  const response = await fetch(`/api/streamer/backgrounds?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Delete failed' : payload.error
    throw new Error(message)
  }
}

export async function saveStreamerSettings(accessToken: string, settings: Record<string, unknown>) {
  const response = await fetch('/api/streamer/settings', {
    method: 'PUT',
    headers: authHeaders(accessToken),
    body: JSON.stringify(settings),
  })
  const payload = (await response.json()) as { success: true; settings: unknown } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Save failed' : payload.error
    throw new Error(message)
  }
  return payload.settings
}

export async function deleteWorld(accessToken: string, worldId: string) {
  const response = await fetch(`/api/worlds/${worldId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Delete failed' : payload.error
    throw new Error(message)
  }
}

export async function updateWorldTitle(accessToken: string, worldId: string, title: string) {
  const response = await fetch(`/api/worlds/${worldId}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ title }),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Update failed' : payload.error
    throw new Error(message)
  }
}

export async function fetchStreamerScenePacks(accessToken: string): Promise<StreamerScenePack[]> {
  const response = await fetch('/api/streamer/scene-packs', {
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as
    | { success: true; packs: StreamerScenePack[] }
    | ApiErrorResponse
  if (!response.ok || !payload.success) return []
  return payload.packs
}

export async function createStreamerScenePack(
  accessToken: string,
  input: { name: string; moodId: string; playOrder?: 'sequential' | 'random'; isLoop?: boolean },
): Promise<StreamerScenePack> {
  const response = await fetch('/api/streamer/scene-packs', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  })
  const payload = (await response.json()) as
    | { success: true; pack: StreamerScenePack }
    | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Create scene pack failed' : payload.error)
  }
  return payload.pack
}

export async function updateStreamerScenePack(
  accessToken: string,
  packId: string,
  input: Partial<{
    name: string
    moodId: string
    status: 'draft' | 'active' | 'archived'
    playOrder: 'sequential' | 'random'
    isLoop: boolean
  }>,
): Promise<StreamerScenePack> {
  const response = await fetch(`/api/streamer/scene-packs/${encodeURIComponent(packId)}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  })
  const payload = (await response.json()) as
    | { success: true; pack: StreamerScenePack }
    | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Update scene pack failed' : payload.error)
  }
  return payload.pack
}

export async function deleteStreamerScenePack(accessToken: string, packId: string): Promise<void> {
  const response = await fetch(`/api/streamer/scene-packs/${encodeURIComponent(packId)}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Delete scene pack failed' : payload.error)
  }
}

export async function generateStreamerScenePackImages(
  accessToken: string,
  packId: string,
  input: { prompt: string; count: number; durationSec?: number; particlePreset?: string },
): Promise<{
  generated: StreamerScenePackItem[]
  usage: {
    monthKey: string
    quotaImages: number
    usedImages: number
    remainingImages: number
  }
}> {
  const response = await fetch(`/api/streamer/scene-packs/${encodeURIComponent(packId)}/generate`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  })
  const payload = (await response.json()) as
    | {
        success: true
        generated: StreamerScenePackItem[]
        usage: {
          monthKey: string
          quotaImages: number
          usedImages: number
          remainingImages: number
        }
      }
    | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Generate scene pack images failed' : payload.error)
  }
  return { generated: payload.generated, usage: payload.usage }
}

export async function activateStreamerScenePack(accessToken: string, packId: string): Promise<void> {
  const response = await fetch(`/api/streamer/scene-packs/${encodeURIComponent(packId)}/activate`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Activate scene pack failed' : payload.error)
  }
}

export async function updateStreamerScenePackItems(
  accessToken: string,
  packId: string,
  items: Array<{ id: string; sortOrder?: number; durationSec?: number }>,
): Promise<StreamerScenePackItem[]> {
  const response = await fetch(`/api/streamer/scene-packs/${encodeURIComponent(packId)}/items`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ items }),
  })
  const payload = (await response.json()) as
    | { success: true; items: StreamerScenePackItem[] }
    | ApiErrorResponse
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Update scene pack items failed' : payload.error)
  }
  return payload.items
}

export async function fetchStreamerScenePlayback(accessToken: string): Promise<StreamerScenePack | null> {
  const response = await fetch('/api/streamer/scene-playback', {
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as
    | { success: true; pack: StreamerScenePack | null }
    | ApiErrorResponse
  if (!response.ok || !payload.success) return null
  return payload.pack
}
