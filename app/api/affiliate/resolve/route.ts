import { NextResponse } from 'next/server'
import { normalizeAffiliateSlug } from '@/lib/affiliate'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = normalizeAffiliateSlug(searchParams.get('slug'))
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Invalid slug' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { data } = await supabase
      .from('affiliates')
      .select('slug, display_name')
      .eq('slug', slug)
      .maybeSingle<{ slug: string; display_name: string | null }>()

    return NextResponse.json({
      success: true,
      valid: Boolean(data),
      slug,
      displayName: data?.display_name ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown resolve error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
