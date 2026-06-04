import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const body = (await req.json()) as { worldId?: string; reason?: string }
    const worldId = body.worldId?.trim()
    const reason = body.reason?.trim()

    if (!worldId || !reason) {
      return jsonError('worldId and reason are required', 400)
    }

    if (reason.length > 500) {
      return jsonError('Reason is too long', 400)
    }

    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('reports').insert({
      reporter_id: auth.user.id,
      world_id: worldId,
      reason,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown report error'
    return jsonError(message, status)
  }
}
