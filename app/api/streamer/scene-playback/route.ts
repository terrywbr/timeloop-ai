import { NextResponse } from 'next/server'
import {
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasCreatorToolsAccess,
} from '@/lib/supabase-server'
import type { StreamerScenePackItemRow, StreamerScenePackRow } from '@/lib/streamer-scene-pack'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

type ActivePackWithItems = StreamerScenePackRow & {
  items: StreamerScenePackItemRow[]
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) return jsonError('Streamer Pass required', 403)

    const { data: pack, error } = await supabase
      .from('streamer_scene_packs')
      .select(
        'id,user_id,name,mood_id,status,is_loop,play_order,created_at,updated_at,items:streamer_scene_pack_items(id,pack_id,image_url,storage_path,sort_order,duration_sec,seed,prompt_snapshot,created_at)',
      )
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .maybeSingle<ActivePackWithItems>()

    if (error) throw error
    if (!pack) return NextResponse.json({ success: true, pack: null })

    const items = pack.items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        sortOrder: item.sort_order,
        durationSec: item.duration_sec,
      }))

    return NextResponse.json({
      success: true,
      pack: {
        id: pack.id,
        name: pack.name,
        moodId: pack.mood_id,
        status: pack.status,
        isLoop: pack.is_loop,
        playOrder: pack.play_order,
        createdAt: pack.created_at,
        updatedAt: pack.updated_at,
        items,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scene playback error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
