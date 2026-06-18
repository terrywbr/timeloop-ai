import { NextResponse } from 'next/server'
import {
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasCreatorToolsAccess,
} from '@/lib/supabase-server'
import type { StreamerScenePackItemRow, StreamerScenePackRow } from '@/lib/streamer-scene-pack'
import { isMusicMoodId } from '@/lib/music-moods'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

type PackWithItems = StreamerScenePackRow & {
  items: StreamerScenePackItemRow[]
}

function serializePack(pack: PackWithItems) {
  return {
    id: pack.id,
    name: pack.name,
    moodId: pack.mood_id,
    status: pack.status,
    isLoop: pack.is_loop,
    playOrder: pack.play_order,
    createdAt: pack.created_at,
    updatedAt: pack.updated_at,
    items: pack.items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        sortOrder: item.sort_order,
        durationSec: item.duration_sec,
      })),
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const { data: packs, error } = await supabase
      .from('streamer_scene_packs')
      .select(
        'id,user_id,name,mood_id,status,is_loop,play_order,created_at,updated_at,items:streamer_scene_pack_items(id,pack_id,image_url,storage_path,sort_order,duration_sec,seed,prompt_snapshot,created_at)',
      )
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    const serialized = ((packs ?? []) as PackWithItems[]).map(serializePack)

    return NextResponse.json({ success: true, packs: serialized })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scene packs error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const body = (await req.json()) as {
      name?: string
      moodId?: string
      playOrder?: 'sequential' | 'random'
      isLoop?: boolean
    }

    const name = body.name?.trim()
    if (!name) return jsonError('name is required', 400)
    const moodId = body.moodId?.trim() ?? 'deep-night'
    if (!isMusicMoodId(moodId)) return jsonError('Invalid moodId', 400)
    const playOrder = body.playOrder === 'random' ? 'random' : 'sequential'
    const isLoop = body.isLoop ?? true

    const { data: pack, error } = await supabase
      .from('streamer_scene_packs')
      .insert({
        user_id: auth.user.id,
        name,
        mood_id: moodId,
        play_order: playOrder,
        is_loop: isLoop,
        status: 'draft',
      })
      .select(
        'id,user_id,name,mood_id,status,is_loop,play_order,created_at,updated_at,items:streamer_scene_pack_items(id,pack_id,image_url,storage_path,sort_order,duration_sec,seed,prompt_snapshot,created_at)',
      )
      .single<PackWithItems>()

    if (error) throw error
    return NextResponse.json({ success: true, pack: serializePack(pack) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown create scene pack error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
