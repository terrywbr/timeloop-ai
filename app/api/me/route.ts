import { NextResponse } from 'next/server'
import {
  hasCreatorToolsAccess,
  hasDownloadAccess,
  hasStreamerPlanAccess,
  hasUnlimitedGenerationAccess,
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasVipAccess,
} from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    const monthKey = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`
    const { data: usage } = await supabase
      .from('streamer_quota_usage_monthly')
      .select('used_images,quota_images,month_key')
      .eq('user_id', profile.id)
      .maybeSingle<{ used_images: number; quota_images: number; month_key: string }>()
    const streamerQuota = profile.streamer_monthly_quota_images ?? usage?.quota_images ?? 300
    const streamerUsed = usage?.month_key === monthKey ? usage.used_images : 0

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        plan: profile.plan,
        vipStatus: profile.vip_status,
        vipUntil: profile.vip_until,
        isVip: hasVipAccess(profile),
        isStreamer: hasStreamerPlanAccess(profile),
        isStreamerPlan: hasStreamerPlanAccess(profile),
        hasCreatorTools: hasCreatorToolsAccess(profile),
        hasUnlimitedGeneration: hasUnlimitedGenerationAccess(profile),
        hasDownloadAccess: hasDownloadAccess(profile),
        remainingCredits: profile.remaining_credits,
        monthlyGenerationLimit: profile.monthly_generation_limit,
        creditsResetAt: profile.credits_reset_at,
        streamerMonthlyQuotaImages: streamerQuota,
        streamerUsedImages: streamerUsed,
        streamerRemainingImages: Math.max(0, streamerQuota - streamerUsed),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown profile error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
