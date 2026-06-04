import { NextResponse } from 'next/server'
import { attachCreatorsToWorldRows } from '@/lib/community/fetch-worlds-with-creators'
import { serializeGalleryWorld } from '@/lib/community/serialize-world'
import { resolveOptionalViewerId } from '@/lib/community/auth-viewer'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'
import type { GeneratedWorldRow } from '@/lib/supabase-types'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const viewerId = await resolveOptionalViewerId(req)
    const supabase = createSupabaseAdminClient()

    const { data: row, error } = await supabase
      .from('generated_worlds')
      .select('*')
      .eq('id', id)
      .maybeSingle<GeneratedWorldRow>()

    if (error) throw error
    if (!row) return jsonError('World not found', 404)
    if (row.is_private && row.user_id !== viewerId) {
      return jsonError('World not found', 404)
    }

    const [enriched] = await attachCreatorsToWorldRows(supabase, [row])
    let isLiked: boolean | undefined
    let isSaved: boolean | undefined

    if (viewerId) {
      const [likeRes, saveRes] = await Promise.all([
        supabase.from('world_likes').select('world_id').eq('user_id', viewerId).eq('world_id', id).maybeSingle(),
        supabase.from('world_saves').select('world_id').eq('user_id', viewerId).eq('world_id', id).maybeSingle(),
      ])
      isLiked = Boolean(likeRes.data)
      isSaved = Boolean(saveRes.data)
    }

    const world = await serializeGalleryWorld(supabase, enriched, { isLiked, isSaved })
    return NextResponse.json({ success: true, world })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown world fetch error'
    return jsonError(message, 500)
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const body = (await req.json()) as {
      title?: string
      isPrivate?: boolean
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.title === 'string') updates.title = body.title.trim()
    if (typeof body.isPrivate === 'boolean') {
      updates.is_private = body.isPrivate
      if (body.isPrivate) updates.published_at = null
    }

    if (Object.keys(updates).length === 0) {
      return jsonError('No supported fields to update', 400)
    }

    const { error } = await supabase
      .from('generated_worlds')
      .update(updates)
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown world update error'
    return jsonError(message, status)
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()

    const { error } = await supabase
      .from('generated_worlds')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown world delete error'
    return jsonError(message, status)
  }
}
