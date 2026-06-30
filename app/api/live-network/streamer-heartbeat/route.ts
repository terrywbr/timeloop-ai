import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasCreatorToolsAccess,
} from '@/lib/supabase-server'
import { sanitizeLiveNetworkField } from '@/lib/live-network-heartbeat'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)

    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const body = (await req.json()) as {
      roomName?: string
      subtitle?: string
      countryFlag?: string
      icon?: string
    }

    const displayFallback =
      profile.display_name?.trim() ||
      profile.email?.split('@')[0]?.trim() ||
      'Live Room'

    const roomName = sanitizeLiveNetworkField(body.roomName, 80, displayFallback)
    const subtitle = sanitizeLiveNetworkField(body.subtitle, 120, 'Live on Time Loop AI')
    const countryFlag = sanitizeLiveNetworkField(body.countryFlag, 8, '🌍')
    const icon = sanitizeLiveNetworkField(body.icon, 8, '🎧')
    const nowIso = new Date().toISOString()

    const { error } = await supabase.from('streamer_live_presence').upsert(
      {
        user_id: profile.id,
        room_name: roomName,
        subtitle,
        country_flag: countryFlag,
        icon,
        last_seen_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    )

    if (error) throw error

    return NextResponse.json({ success: true, userId: profile.id, roomName })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown streamer heartbeat error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()

    const { error } = await supabase
      .from('streamer_live_presence')
      .delete()
      .eq('user_id', auth.user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown streamer leave error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
