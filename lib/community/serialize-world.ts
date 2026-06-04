import type { SupabaseClient } from '@supabase/supabase-js'
import { isMusicMoodId } from '@/lib/music-moods'
import type { GalleryWorld } from '@/lib/community/types'
import type { GeneratedWorldRow } from '@/lib/supabase-types'
import { serializeGeneratedWorld } from '@/lib/supabase-server'

export type WorldRowWithCreator = GeneratedWorldRow & {
  users?: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

export async function serializeGalleryWorld(
  supabase: SupabaseClient,
  row: WorldRowWithCreator,
  options?: { isLiked?: boolean; isSaved?: boolean },
): Promise<GalleryWorld> {
  const base = await serializeGeneratedWorld(supabase, row)
  const moodId = row.mood_id && isMusicMoodId(row.mood_id) ? row.mood_id : null

  return {
    ...base,
    userId: row.user_id,
    creatorName: row.users?.display_name ?? null,
    creatorAvatar: row.users?.avatar_url ?? null,
    isPrivate: row.is_private,
    publishedAt: row.published_at ?? null,
    moodId,
    description: row.description ?? null,
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    isLiked: options?.isLiked,
    isSaved: options?.isSaved,
  }
}

export async function serializeGalleryWorlds(
  supabase: SupabaseClient,
  rows: WorldRowWithCreator[],
  viewerId?: string | null,
): Promise<GalleryWorld[]> {
  if (rows.length === 0) return []

  let likedIds = new Set<string>()
  let savedIds = new Set<string>()

  if (viewerId) {
    const worldIds = rows.map((r) => r.id)
    const [likesRes, savesRes] = await Promise.all([
      supabase.from('world_likes').select('world_id').eq('user_id', viewerId).in('world_id', worldIds),
      supabase.from('world_saves').select('world_id').eq('user_id', viewerId).in('world_id', worldIds),
    ])
    likedIds = new Set((likesRes.data ?? []).map((r) => r.world_id as string))
    savedIds = new Set((savesRes.data ?? []).map((r) => r.world_id as string))
  }

  return Promise.all(
    rows.map((row) =>
      serializeGalleryWorld(supabase, row, {
        isLiked: viewerId ? likedIds.has(row.id) : undefined,
        isSaved: viewerId ? savedIds.has(row.id) : undefined,
      }),
    ),
  )
}
