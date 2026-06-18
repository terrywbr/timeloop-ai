import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function readAdminSecret(req: Request) {
  return req.headers.get('x-admin-secret')?.trim() || null
}

export async function POST(req: Request) {
  const expected = process.env.ADMIN_API_SECRET?.trim()
  if (!expected) return jsonError('Admin API not configured', 503)

  const provided = readAdminSecret(req)
  if (!provided || provided !== expected) return jsonError('Unauthorized', 401)

  try {
    const body = (await req.json()) as {
      userId?: string
      plan?: 'free' | 'vip' | 'streamer'
      vipUntil?: string | null
      note?: string
      addCredits?: number
    }

    if (!body.userId) return jsonError('userId is required', 400)
    if (!body.plan) return jsonError('plan is required', 400)

    const supabase = createSupabaseAdminClient()
    const updates: Record<string, unknown> = {
      plan: body.plan,
      updated_at: new Date().toISOString(),
    }

    if (body.plan === 'streamer' || body.plan === 'vip') {
      updates.vip_status = 'active'
      updates.vip_until = body.vipUntil ?? null
    }

    if (body.plan === 'streamer') {
      updates.lemon_squeezy_variant_id = process.env.LEMON_SQUEEZY_STREAMER_VARIANT_ID?.trim() ?? null
    }

    const { data: profile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', body.userId)
      .select('*')
      .maybeSingle()

    if (error) {
      // Compatibility fallback: some environments still enforce users.plan in ('free','vip').
      if (body.plan === 'streamer' && String(error.message).includes('users_plan_check')) {
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from('users')
          .update({
            ...updates,
            plan: 'vip',
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.userId)
          .select('*')
          .maybeSingle()
        if (fallbackError) throw fallbackError
        if (!fallbackProfile) return jsonError('User not found', 404)
        return NextResponse.json({
          success: true,
          profile: fallbackProfile,
          compatibilityMode: 'streamer_plan_fallback_to_vip_variant',
        })
      }
      throw error
    }
    if (!profile) return jsonError('User not found', 404)

    if (body.addCredits && body.addCredits > 0) {
      const newBalance = (profile.remaining_credits ?? 0) + body.addCredits
      await supabase
        .from('users')
        .update({ remaining_credits: newBalance })
        .eq('id', body.userId)

      await supabase.from('credit_transactions').insert({
        user_id: body.userId,
        amount: body.addCredits,
        balance_after: newBalance,
        type: 'admin_adjustment',
        source: 'admin',
        metadata: { note: body.note ?? 'wechat_manual', source: 'wechat_manual' },
      })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown grant error'
    return jsonError(message, 500)
  }
}
