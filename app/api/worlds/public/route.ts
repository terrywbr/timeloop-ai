import { NextResponse } from 'next/server'
import { attachCreatorsToWorldRows } from '@/lib/community/fetch-worlds-with-creators'
import { serializeGalleryWorlds } from '@/lib/community/serialize-world'
import { resolveOptionalViewerId } from '@/lib/community/auth-viewer'
import type { PublicWorldsSort } from '@/lib/community/types'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { GeneratedWorldRow } from '@/lib/supabase-types'

export const runtime = 'nodejs'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function parseSort(value: string | null): PublicWorldsSort {
  if (value === 'featured' || value === 'newest' || value === 'following') return value
  return 'newest'
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = parseSort(searchParams.get('sort'))
    const cursor = searchParams.get('cursor')
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    )

    const viewerId = await resolveOptionalViewerId(req)
    const supabase = createSupabaseAdminClient()

    if (sort === 'following') {
      if (!viewerId) {
        return NextResponse.json({ success: true, worlds: [], nextCursor: null })
      }

      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerId)

      if (followError) throw followError

      const followingIds = (followRows ?? []).map((r) => r.following_id as string)
      if (followingIds.length === 0) {
        return NextResponse.json({ success: true, worlds: [], nextCursor: null })
      }

      let query = supabase
        .from('generated_worlds')
        .select('*')
        .eq('is_private', false)
        .in('user_id', followingIds)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit + 1)

      if (cursor) query = query.lt('published_at', cursor)

      const { data, error } = await query.returns<GeneratedWorldRow[]>()
      if (error) throw error

      return finishPage(supabase, data ?? [], limit, viewerId, (last) => last.published_at ?? last.created_at)
    }

    let query = supabase
      .from('generated_worlds')
      .select('*')
      .eq('is_private', false)
      .limit(limit + 1)

    if (sort === 'featured') {
      query = query.eq('is_featured', true).order('created_at', { ascending: false })
      if (cursor) query = query.lt('created_at', cursor)
      const { data, error } = await query.returns<GeneratedWorldRow[]>()
      if (error) throw error
      return finishPage(supabase, data ?? [], limit, viewerId, (last) => last.created_at)
    }

    query = query.order('published_at', { ascending: false, nullsFirst: false })
    if (cursor) query = query.lt('published_at', cursor)

    const { data, error } = await query.returns<GeneratedWorldRow[]>()
    if (error) throw error

    return finishPage(
      supabase,
      data ?? [],
      limit,
      viewerId,
      (last) => last.published_at ?? last.created_at,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown public worlds error'
    return jsonError(message, 500)
  }
}

async function finishPage(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  rows: GeneratedWorldRow[],
  limit: number,
  viewerId: string | null,
  cursorFrom: (row: GeneratedWorldRow) => string | null,
) {
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const enriched = await attachCreatorsToWorldRows(supabase, pageRows)
  const worlds = await serializeGalleryWorlds(supabase, enriched, viewerId)
  const nextCursor = hasMore && pageRows.length > 0 ? cursorFrom(pageRows[pageRows.length - 1]) : null
  return NextResponse.json({ success: true, worlds, nextCursor })
}
