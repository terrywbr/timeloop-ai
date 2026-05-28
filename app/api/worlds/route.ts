import { NextResponse } from 'next/server'
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
  serializeGeneratedWorld,
} from '@/lib/supabase-server'
import type { GeneratedWorldRow } from '@/lib/supabase-types'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseAdminClient()

    let userId: string | null = null
    try {
      const auth = await getAuthenticatedUser(req)
      userId = auth.user.id
    } catch {
      userId = null
    }

    const { data: featuredRows, error: featuredError } = await supabase
      .from('generated_worlds')
      .select('*')
      .eq('is_featured', true)
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<GeneratedWorldRow[]>()

    if (featuredError) throw featuredError

    let ownRows: GeneratedWorldRow[] = []
    if (userId) {
      const { data, error } = await supabase
        .from('generated_worlds')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
        .returns<GeneratedWorldRow[]>()

      if (error) throw error
      ownRows = data ?? []
    }

    const featured = await Promise.all((featuredRows ?? []).map((row) => serializeGeneratedWorld(supabase, row)))
    const own = await Promise.all(ownRows.map((row) => serializeGeneratedWorld(supabase, row)))

    return NextResponse.json({
      success: true,
      featured,
      own,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown worlds API error'
    return jsonError(message, 500)
  }
}
