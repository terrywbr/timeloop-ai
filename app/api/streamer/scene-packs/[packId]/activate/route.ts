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

export async function POST(req: Request, ctx: { params: Promise<{ packId: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) return jsonError('Streamer Pass required', 403)

    const { packId } = await ctx.params

    const { data: targetPack } = await supabase
      .from('streamer_scene_packs')
      .select('id')
      .eq('id', packId)
      .eq('user_id', auth.user.id)
      .maybeSingle<{ id: string }>()
    if (!targetPack) return jsonError('Pack not found', 404)

    const now = new Date().toISOString()
    const { error: resetError } = await supabase
      .from('streamer_scene_packs')
      .update({ status: 'draft', updated_at: now })
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
    if (resetError) throw resetError

    const { error: activateError } = await supabase
      .from('streamer_scene_packs')
      .update({ status: 'active', updated_at: now })
      .eq('id', packId)
      .eq('user_id', auth.user.id)
    if (activateError) throw activateError

    return NextResponse.json({ success: true, packId, status: 'active' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown activate scene pack error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
