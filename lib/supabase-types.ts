export type UserPlan = 'free' | 'vip' | 'streamer'
export type VipStatus = 'inactive' | 'active' | 'past_due' | 'cancelled' | 'paused' | 'expired'
export type WorldQuality = 'standard' | 'high' | '4k'
export type CreditTransactionType = 'purchase' | 'generation' | 'refund' | 'monthly_reset' | 'admin_adjustment'
export type CreditTransactionSource = 'system' | 'lemon_squeezy' | 'generation' | 'admin'

export type UserProfile = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  plan: UserPlan
  vip_status: VipStatus
  vip_until: string | null
  monthly_generation_limit: number
  remaining_credits: number
  credits_reset_at: string
  streamer_monthly_quota_images: number
  lemon_squeezy_customer_id: string | null
  lemon_squeezy_subscription_id: string | null
  lemon_squeezy_subscription_item_id: string | null
  lemon_squeezy_variant_id: string | null
  is_founding_creator: boolean
  founding_enrolled_at: string | null
  created_at: string
  updated_at: string
}

export type GeneratedWorldRow = {
  id: string
  user_id: string
  prompt: string
  rewritten_prompt: string | null
  title: string | null
  background_image: string
  depth_map: string
  storage_background_path: string | null
  storage_depth_path: string | null
  particle_preset: string
  shader_preset: string | null
  ambience_audio: string | null
  width: number | null
  height: number | null
  quality: WorldQuality
  is_featured: boolean
  is_private: boolean
  published_at: string | null
  mood_id: string | null
  description: string | null
  tags: string[] | null
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
}

export type PublicGeneratedWorld = {
  id: string
  title: string
  prompt: string
  backgroundImage: string
  depthMap: string
  particlePreset: string
  shaderPreset?: string
  ambienceAudio?: string
  isFeatured: boolean
  isPrivate?: boolean
  publishedAt?: string | null
  moodId?: string | null
  viewCount?: number
  likeCount?: number
  createdAt: string
}
