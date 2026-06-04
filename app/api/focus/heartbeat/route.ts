import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function sessionKeyFromRequest(req: Request, userId: string | null) {
  if (userId) return `user:${userId}`
  const guest = req.headers.get('x-focus-guest')?.trim()
  if (guest && guest.length <= 64) return `guest:${guest}`
  return null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { worldId?: string }
    const worldId = body.worldId?.trim()
    if (!worldId) return jsonError('worldId is required', 400)

    let userId: string | null = null
    try {
      const auth = await getAuthenticatedUser(req)
      userId = auth.user.id
    } catch {
      userId = null
    }

    const sessionKey = sessionKeyFromRequest(req, userId)
    if (!sessionKey) return jsonError('Missing session identity', 400)

    const supabase = createSupabaseAdminClient()

    const { data: world, error: worldError } = await supabase
      .from('generated_worlds')
      .select('id, is_private')
      .eq('id', worldId)
      .maybeSingle<{ id: string; is_private: boolean }>()

    if (worldError) throw worldError
    if (!world || world.is_private) return jsonError('World not found', 404)

    const { error } = await supabase.from('focus_sessions').upsert(
      {
        world_id: worldId,
        user_id: userId,
        session_key: sessionKey,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'world_id,session_key' },
    )

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown heartbeat error'
    return jsonError(message, 500)
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const worldId = searchParams.get('worldId')?.trim()
    if (!worldId) return jsonError('worldId is required', 400)

    let userId: string | null = null
    try {
      const auth = await getAuthenticatedUser(req)
      userId = auth.user.id
    } catch {
      userId = null
    }

    const sessionKey = sessionKeyFromRequest(req, userId)
    if (!sessionKey) return jsonError('Missing session identity', 400)

    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('world_id', worldId)
      .eq('session_key', sessionKey)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown focus leave error'
    return jsonError(message, 500)
  }
}
