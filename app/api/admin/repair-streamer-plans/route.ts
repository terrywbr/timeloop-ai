import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, isMislabeledStreamerCompatProfile } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function readAdminSecret(req: Request) {
  return req.headers.get('x-admin-secret')?.trim() || null
}

/**
 * Promotes users stuck on plan=vip due to legacy users_plan_check (free|vip only).
 * Requires DB constraint already allows streamer — run migration 20260623 first.
 */
export async function POST(req: Request) {
  const expected = process.env.ADMIN_API_SECRET?.trim()
  if (!expected) return jsonError('Admin API not configured', 503)

  const provided = readAdminSecret(req)
  if (!provided || provided !== expected) return jsonError('Unauthorized', 401)

  const streamerVariantId = process.env.LEMON_SQUEEZY_STREAMER_VARIANT_ID?.trim() ?? '1771738'
  const supabase = createSupabaseAdminClient()

  try {
    const { data: candidates, error: selectError } = await supabase
      .from('users')
      .select('id, email, plan, lemon_squeezy_variant_id, is_founding_creator, vip_status, vip_until')
      .eq('plan', 'vip')

    if (selectError) throw selectError

    const toRepair = (candidates ?? []).filter((row) =>
      isMislabeledStreamerCompatProfile(row as import('@/lib/supabase-types').UserProfile),
    )

    const repaired: Array<{ id: string; email: string | null }> = []

    for (const row of toRepair) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ plan: 'streamer', updated_at: new Date().toISOString() })
        .eq('id', row.id)

      if (updateError) {
        if (String(updateError.message).includes('users_plan_check')) {
          return jsonError(
            'Database still rejects plan=streamer. Run supabase/migrations/20260623_repair_streamer_plan.sql in Supabase SQL Editor first.',
            503,
          )
        }
        throw updateError
      }
      repaired.push({ id: row.id, email: row.email })
    }

    return NextResponse.json({
      success: true,
      streamerVariantId,
      candidatesChecked: candidates?.length ?? 0,
      repairedCount: repaired.length,
      repaired,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown repair error'
    return jsonError(message, 500)
  }
}
