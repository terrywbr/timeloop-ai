import { NextResponse } from 'next/server'
import { isMusicMoodId } from '@/lib/music-moods'
import { attachCreatorsToWorldRows } from '@/lib/community/fetch-worlds-with-creators'
import { serializeGalleryWorld } from '@/lib/community/serialize-world'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'
import type { GeneratedWorldRow } from '@/lib/supabase-types'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const body = (await req.json()) as {
      isPublic?: boolean
      title?: string
      description?: string
      moodId?: string
      tags?: string[]
    }

    const { data: existing, error: fetchError } = await supabase
      .from('generated_worlds')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle<GeneratedWorldRow>()

    if (fetchError) throw fetchError
    if (!existing) return jsonError('World not found', 404)

    const isPublic = body.isPublic ?? true
    const updates: Record<string, unknown> = {
      is_private: !isPublic,
      published_at: isPublic ? existing.published_at ?? new Date().toISOString() : null,
    }

    if (typeof body.title === 'string') updates.title = body.title.trim()
    if (typeof body.description === 'string') updates.description = body.description.trim()
    if (body.moodId && isMusicMoodId(body.moodId)) updates.mood_id = body.moodId
    if (Array.isArray(body.tags)) updates.tags = body.tags.filter((t) => typeof t === 'string').slice(0, 10)

    const { data: row, error } = await supabase
      .from('generated_worlds')
      .update(updates)
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select('*')
      .single<GeneratedWorldRow>()

    if (error) throw error

    const [enriched] = await attachCreatorsToWorldRows(supabase, [row])
    const world = await serializeGalleryWorld(supabase, enriched)
    return NextResponse.json({ success: true, world })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown publish error'
    return jsonError(message, status)
  }
}
