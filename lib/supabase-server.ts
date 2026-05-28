import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { GeneratedWorldRow, PublicGeneratedWorld, UserProfile } from './supabase-types'

const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 24

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function createSupabaseAdminClient() {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

export function createSupabaseUserClient(accessToken: string) {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

export function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') ?? ''
  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export async function getAuthenticatedUser(req: Request): Promise<{
  accessToken: string
  user: User
}> {
  const accessToken = getBearerToken(req)
  if (!accessToken) {
    throw new Error('請先登入後再使用此功能。')
  }

  const supabase = createSupabaseUserClient(accessToken)
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    throw new Error('登入狀態已失效，請重新登入。')
  }

  return { accessToken, user: data.user }
}

export async function refreshMonthlyCreditsIfDue(
  supabase: SupabaseClient,
  profile: UserProfile,
): Promise<UserProfile> {
  const resetAt = new Date(profile.credits_reset_at)
  if (resetAt.getTime() > Date.now()) return profile

  const nextResetAt = new Date(resetAt)
  while (nextResetAt.getTime() <= Date.now()) {
    nextResetAt.setMonth(nextResetAt.getMonth() + 1)
  }

  const restoredCredits = profile.monthly_generation_limit
  const { data: updatedProfile, error: updateError } = await supabase
    .from('users')
    .update({
      remaining_credits: restoredCredits,
      credits_reset_at: nextResetAt.toISOString(),
    })
    .eq('id', profile.id)
    .select('*')
    .single<UserProfile>()

  if (updateError) throw updateError

  const { error: transactionError } = await supabase.from('credit_transactions').insert({
    user_id: profile.id,
    amount: restoredCredits,
    balance_after: restoredCredits,
    type: 'monthly_reset',
    source: 'system',
    metadata: {
      previous_reset_at: profile.credits_reset_at,
      next_reset_at: nextResetAt.toISOString(),
    },
  })

  if (transactionError) throw transactionError
  return updatedProfile
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<UserProfile> {
  const { data: existingProfile, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<UserProfile>()

  if (selectError) throw selectError
  if (existingProfile) {
    return refreshMonthlyCreditsIfDue(supabase, existingProfile)
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email ?? null,
      display_name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    })
    .select('*')
    .single<UserProfile>()

  if (insertError) throw insertError
  return createdProfile
}

export function hasVipAccess(profile: UserProfile) {
  if (profile.plan !== 'vip' || profile.vip_status !== 'active') return false
  if (!profile.vip_until) return true
  return new Date(profile.vip_until).getTime() > Date.now()
}

export async function createSignedStorageUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null,
) {
  if (!path) return ''
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS)

  if (error) throw error
  return data.signedUrl
}

export async function uploadRemoteAssetToStorage({
  supabase,
  sourceUrl,
  bucket,
  path,
  contentType,
}: {
  supabase: SupabaseClient
  sourceUrl: string
  bucket: string
  path: string
  contentType: string
}) {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to download generated asset: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    })

  if (error) throw error
  return path
}

export async function serializeGeneratedWorld(
  supabase: SupabaseClient,
  row: GeneratedWorldRow,
): Promise<PublicGeneratedWorld> {
  const backgroundImage = row.storage_background_path
    ? await createSignedStorageUrl(supabase, 'generated-backgrounds', row.storage_background_path)
    : row.background_image

  const depthMap = row.storage_depth_path
    ? await createSignedStorageUrl(supabase, 'generated-depths', row.storage_depth_path)
    : row.depth_map

  return {
    id: row.id,
    title: row.title ?? row.prompt,
    prompt: row.prompt,
    backgroundImage,
    depthMap,
    particlePreset: row.particle_preset,
    shaderPreset: row.shader_preset ?? undefined,
    ambienceAudio: row.ambience_audio ?? undefined,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  }
}
