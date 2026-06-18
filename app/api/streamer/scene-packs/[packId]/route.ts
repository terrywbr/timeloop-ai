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

async function getOwnedPack(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string, packId: string) {
  const { data: pack, error } = await supabase
    .from('streamer_scene_packs')
    .select(
      'id,user_id,name,mood_id,status,is_loop,play_order,created_at,updated_at,items:streamer_scene_pack_items(id,pack_id,image_url,storage_path,sort_order,duration_sec,seed,prompt_snapshot,created_at)',
    )
    .eq('id', packId)
    .eq('user_id', userId)
    .maybeSingle<PackWithItems>()
  if (error) throw error
  return pack
}

export async function GET(req: Request, ctx: { params: Promise<{ packId: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) return jsonError('Streamer Pass required', 403)

    const { packId } = await ctx.params
    const pack = await getOwnedPack(supabase, auth.user.id, packId)
    if (!pack) return jsonError('Pack not found', 404)
    return NextResponse.json({ success: true, pack: serializePack(pack) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scene pack error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ packId: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) return jsonError('Streamer Pass required', 403)

    const { packId } = await ctx.params
    const body = (await req.json()) as {
      name?: string
      moodId?: string
      status?: 'draft' | 'active' | 'archived'
      playOrder?: 'sequential' | 'random'
      isLoop?: boolean
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (typeof body.name === 'string' && body.name.trim()) updatePayload.name = body.name.trim()
    if (typeof body.moodId === 'string') {
      if (!isMusicMoodId(body.moodId)) return jsonError('Invalid moodId', 400)
      updatePayload.mood_id = body.moodId
    }
    if (body.status === 'draft' || body.status === 'active' || body.status === 'archived') {
      updatePayload.status = body.status
    }
    if (body.playOrder === 'random' || body.playOrder === 'sequential') {
      updatePayload.play_order = body.playOrder
    }
    if (typeof body.isLoop === 'boolean') updatePayload.is_loop = body.isLoop

    const { error } = await supabase
      .from('streamer_scene_packs')
      .update(updatePayload)
      .eq('id', packId)
      .eq('user_id', auth.user.id)
    if (error) throw error

    const pack = await getOwnedPack(supabase, auth.user.id, packId)
    if (!pack) return jsonError('Pack not found', 404)
    return NextResponse.json({ success: true, pack: serializePack(pack) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown update scene pack error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ packId: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) return jsonError('Streamer Pass required', 403)

    const { packId } = await ctx.params
    const { error } = await supabase
      .from('streamer_scene_packs')
      .delete()
      .eq('id', packId)
      .eq('user_id', auth.user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown delete scene pack error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
