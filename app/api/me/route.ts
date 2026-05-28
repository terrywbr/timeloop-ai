import { NextResponse } from 'next/server'
import {
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
        remainingCredits: profile.remaining_credits,
        monthlyGenerationLimit: profile.monthly_generation_limit,
        creditsResetAt: profile.credits_reset_at,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown profile error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
