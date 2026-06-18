import { NextResponse } from 'next/server'
import {
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasCreatorToolsAccess,
} from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function PATCH(req: Request, ctx: { params: Promise<{ packId: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) return jsonError('Streamer Pass required', 403)

    const { packId } = await ctx.params
    const body = (await req.json()) as {
      items?: Array<{ id: string; sortOrder?: number; durationSec?: number }>
    }
    const items = body.items ?? []
    if (!Array.isArray(items) || items.length === 0) return jsonError('items is required', 400)

    const { data: ownerPack } = await supabase
      .from('streamer_scene_packs')
      .select('id')
      .eq('id', packId)
      .eq('user_id', auth.user.id)
      .maybeSingle<{ id: string }>()
    if (!ownerPack) return jsonError('Pack not found', 404)

    for (const item of items) {
      if (!item.id) continue
      const update: Record<string, unknown> = {}
      if (typeof item.sortOrder === 'number') update.sort_order = Math.max(0, Math.floor(item.sortOrder))
      if (typeof item.durationSec === 'number') {
        update.duration_sec = Math.min(3600, Math.max(15, Math.floor(item.durationSec)))
      }
      if (Object.keys(update).length === 0) continue
      const { error } = await supabase
        .from('streamer_scene_pack_items')
        .update(update)
        .eq('id', item.id)
        .eq('pack_id', packId)
      if (error) throw error
    }

    const { data: freshItems, error } = await supabase
      .from('streamer_scene_pack_items')
      .select('id,image_url,sort_order,duration_sec')
      .eq('pack_id', packId)
      .order('sort_order', { ascending: true })
    if (error) throw error

    return NextResponse.json({
      success: true,
      items: (freshItems ?? []).map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        sortOrder: item.sort_order,
        durationSec: item.duration_sec,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown update scene pack items error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
