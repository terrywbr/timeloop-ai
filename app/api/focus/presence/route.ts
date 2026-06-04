import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const ACTIVE_WINDOW_MINUTES = 2

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: Request) {
  try {
    const worldId = new URL(req.url).searchParams.get('worldId')?.trim()
    if (!worldId) return jsonError('worldId is required', 400)

    const supabase = createSupabaseAdminClient()
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000).toISOString()

    const { count, error } = await supabase
      .from('focus_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('world_id', worldId)
      .gte('last_seen_at', cutoff)

    if (error) throw error

    return NextResponse.json({ success: true, count: count ?? 0 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown presence error'
    return jsonError(message, 500)
  }
}
