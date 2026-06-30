import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
} from '@/lib/supabase-server'
import { streamerPresenceCutoffIso } from '@/lib/live-network-constants'
import { isUuid, liveNetworkSessionKey } from '@/lib/live-network-heartbeat'
import { refreshStreamerViewerCount } from '@/lib/live-network-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { streamerUserId?: string }
    const streamerUserId = body.streamerUserId?.trim() ?? ''

    if (!isUuid(streamerUserId)) {
      return jsonError('streamerUserId must be a valid UUID', 400)
    }

    let viewerUserId: string | null = null
    try {
      const auth = await getAuthenticatedUser(req)
      viewerUserId = auth.user.id
    } catch {
      viewerUserId = null
    }

    if (viewerUserId === streamerUserId) {
      return jsonError('Streamer cannot count as own viewer', 400)
    }

    const sessionKey = liveNetworkSessionKey(req, viewerUserId)
    if (!sessionKey) return jsonError('Missing viewer session identity', 400)

    const supabase = createSupabaseAdminClient()
    const streamerCutoff = streamerPresenceCutoffIso()

    const { data: streamerPresence, error: presenceError } = await supabase
      .from('streamer_live_presence')
      .select('user_id')
      .eq('user_id', streamerUserId)
      .gte('last_seen_at', streamerCutoff)
      .maybeSingle()

    if (presenceError) throw presenceError
    if (!streamerPresence) return jsonError('Streamer is not live', 404)

    const nowIso = new Date().toISOString()
    const { error } = await supabase.from('streamer_live_viewers').upsert(
      {
        streamer_user_id: streamerUserId,
        session_key: sessionKey,
        last_seen_at: nowIso,
      },
      { onConflict: 'streamer_user_id,session_key' },
    )

    if (error) throw error

    const viewerCount = await refreshStreamerViewerCount(supabase, streamerUserId)
    return NextResponse.json({ success: true, viewerCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown viewer heartbeat error'
    return jsonError(message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const streamerUserId = new URL(req.url).searchParams.get('streamerUserId')?.trim() ?? ''
    if (!isUuid(streamerUserId)) {
      return jsonError('streamerUserId must be a valid UUID', 400)
    }

    let viewerUserId: string | null = null
    try {
      const auth = await getAuthenticatedUser(req)
      viewerUserId = auth.user.id
    } catch {
      viewerUserId = null
    }

    const sessionKey = liveNetworkSessionKey(req, viewerUserId)
    if (!sessionKey) return jsonError('Missing viewer session identity', 400)

    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('streamer_live_viewers')
      .delete()
      .eq('streamer_user_id', streamerUserId)
      .eq('session_key', sessionKey)

    if (error) throw error

    await refreshStreamerViewerCount(supabase, streamerUserId)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown viewer leave error'
    return jsonError(message, 500)
  }
}
