export type ScenePackStatus = 'draft' | 'active' | 'archived'
export type ScenePackPlayOrder = 'sequential' | 'random'

export type StreamerScenePackRow = {
  id: string
  user_id: string
  name: string
  mood_id: string
  status: ScenePackStatus
  is_loop: boolean
  play_order: ScenePackPlayOrder
  created_at: string
  updated_at: string
}

export type StreamerScenePackItemRow = {
  id: string
  pack_id: string
  image_url: string
  storage_path: string | null
  sort_order: number
  duration_sec: number
  seed: string | null
  prompt_snapshot: string | null
  created_at: string
}

export type StreamerScenePackUsageRow = {
  id: string
  user_id: string
  month_key: string
  used_images: number
  quota_images: number
  updated_at: string
}

export function currentMonthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
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
  status: ScenePackStatus
  isLoop: boolean
  playOrder: ScenePackPlayOrder
  items: StreamerScenePackItem[]
  createdAt: string
  updatedAt: string
}
