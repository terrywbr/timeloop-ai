import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id: followingId } = await context.params
    const auth = await getAuthenticatedUser(req)

    if (auth.user.id === followingId) {
      return jsonError('Cannot follow yourself', 400)
    }

    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('follows').insert({
      follower_id: auth.user.id,
      following_id: followingId,
    })

    if (error && error.code !== '23505') throw error
    return NextResponse.json({ success: true, following: true })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown follow error'
    return jsonError(message, status)
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id: followingId } = await context.params
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', auth.user.id)
      .eq('following_id', followingId)

    if (error) throw error
    return NextResponse.json({ success: true, following: false })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown unfollow error'
    return jsonError(message, status)
  }
}
