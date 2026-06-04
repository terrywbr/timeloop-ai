import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = createSupabaseAdminClient()

    const { data: row, error: fetchError } = await supabase
      .from('generated_worlds')
      .select('id, is_private, view_count')
      .eq('id', id)
      .maybeSingle<{ id: string; is_private: boolean; view_count: number }>()

    if (fetchError) throw fetchError
    if (!row || row.is_private) return jsonError('World not found', 404)

    const { error } = await supabase
      .from('generated_worlds')
      .update({ view_count: (row.view_count ?? 0) + 1 })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown view error'
    return jsonError(message, 500)
  }
}
