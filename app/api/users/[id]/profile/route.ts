import { NextResponse } from 'next/server'
import { attachCreatorsToWorldRows } from '@/lib/community/fetch-worlds-with-creators'
import { serializeGalleryWorlds } from '@/lib/community/serialize-world'
import { resolveOptionalViewerId } from '@/lib/community/auth-viewer'
import type { CreatorProfile } from '@/lib/community/types'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { GeneratedWorldRow } from '@/lib/supabase-types'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const viewerId = await resolveOptionalViewerId(req)
    const supabase = createSupabaseAdminClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url')
      .eq('id', id)
      .maybeSingle<{ id: string; display_name: string | null; avatar_url: string | null }>()

    if (userError) throw userError
    if (!user) return jsonError('User not found', 404)

    const { data: worldRows, error: worldsError } = await supabase
      .from('generated_worlds')
      .select('*')
      .eq('user_id', id)
      .eq('is_private', false)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(50)
      .returns<GeneratedWorldRow[]>()

    if (worldsError) throw worldsError

    const enriched = await attachCreatorsToWorldRows(supabase, worldRows ?? [])
    const worlds = await serializeGalleryWorlds(supabase, enriched, viewerId)
    const totalLikes = worlds.reduce((sum, w) => sum + w.likeCount, 0)

    let isFollowing = false
    if (viewerId && viewerId !== id) {
      const { data: follow } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', viewerId)
        .eq('following_id', id)
        .maybeSingle()
      isFollowing = Boolean(follow)
    }

    const profile: CreatorProfile = {
      id: user.id,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      totalLikes,
      publicWorldCount: worlds.length,
      isFollowing: viewerId ? isFollowing : undefined,
      worlds,
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown profile error'
    return jsonError(message, 500)
  }
}
