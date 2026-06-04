import type { MusicMoodId } from '@/lib/music-moods'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'

export type GalleryWorld = PublicGeneratedWorld & {
  userId: string
  creatorName: string | null
  creatorAvatar: string | null
  isPrivate: boolean
  publishedAt: string | null
  moodId: MusicMoodId | null
  description: string | null
  viewCount: number
  likeCount: number
  isLiked?: boolean
  isSaved?: boolean
}

export type CreatorProfile = {
  id: string
  displayName: string | null
  avatarUrl: string | null
  totalLikes: number
  publicWorldCount: number
  isFollowing?: boolean
  worlds: GalleryWorld[]
}

export type PublicWorldsSort = 'featured' | 'newest' | 'following'

export type PublicWorldsResponse = {
  worlds: GalleryWorld[]
  nextCursor: string | null
}
