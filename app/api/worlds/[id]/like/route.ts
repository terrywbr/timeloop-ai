import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function assertPublicWorld(supabase: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data, error } = await supabase
    .from('generated_worlds')
    .select('id, is_private')
    .eq('id', id)
    .maybeSingle<{ id: string; is_private: boolean }>()
  if (error) throw error
  if (!data || data.is_private) return jsonError('World not found', 404)
  return null
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const notFound = await assertPublicWorld(supabase, id)
    if (notFound) return notFound

    const { error } = await supabase.from('world_likes').insert({
      user_id: auth.user.id,
      world_id: id,
    })

    if (error && error.code !== '23505') throw error
    return NextResponse.json({ success: true, liked: true })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown like error'
    return jsonError(message, status)
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()

    const { error } = await supabase
      .from('world_likes')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('world_id', id)

    if (error) throw error
    return NextResponse.json({ success: true, liked: false })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('登入') ? 401 : 500
    const message = error instanceof Error ? error.message : 'Unknown unlike error'
    return jsonError(message, status)
  }
}
