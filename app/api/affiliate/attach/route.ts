import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const body = (await req.json()) as { slug?: string }
    const slug = body.slug?.trim().toLowerCase()

    if (!slug) {
      return NextResponse.json({ success: true, attached: false, reason: 'no_slug' })
    }

    const supabase = createSupabaseAdminClient()
    const { data: profile } = await supabase
      .from('users')
      .select('referred_by_affiliate_slug')
      .eq('id', auth.user.id)
      .maybeSingle<{ referred_by_affiliate_slug: string | null }>()

    if (profile?.referred_by_affiliate_slug) {
      return NextResponse.json({
        success: true,
        attached: false,
        reason: 'already_set',
        slug: profile.referred_by_affiliate_slug,
      })
    }

    const { error } = await supabase
      .from('users')
      .update({
        referred_by_affiliate_slug: slug,
        referred_at: new Date().toISOString(),
      })
      .eq('id', auth.user.id)

    if (error) throw error

    return NextResponse.json({ success: true, attached: true, slug })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown affiliate attach error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
