import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
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
    if (typeof body.isPrivate === 'boolean') updates.is_private = body.isPrivate

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
