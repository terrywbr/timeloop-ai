import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const FOUNDING_PREMIUM_DAYS = 90

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function readAdminSecret(req: Request) {
  return req.headers.get('x-admin-secret')?.trim() || null
}

function addDaysIso(days: number) {
  const until = new Date()
  until.setDate(until.getDate() + days)
  return until.toISOString()
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
      foundingCreator?: boolean
    }

    if (!body.userId) return jsonError('userId is required', 400)
    if (!body.plan) return jsonError('plan is required', 400)

    const foundingCreator = Boolean(body.foundingCreator)
    const supabase = createSupabaseAdminClient()
    const nowIso = new Date().toISOString()
    const updates: Record<string, unknown> = {
      plan: body.plan,
      updated_at: nowIso,
    }

    if (body.plan === 'streamer' || body.plan === 'vip') {
      updates.vip_status = 'active'
      if (body.vipUntil !== undefined) {
        updates.vip_until = body.vipUntil
      } else if (foundingCreator) {
        updates.vip_until = addDaysIso(FOUNDING_PREMIUM_DAYS)
      } else {
        updates.vip_until = null
      }
    }

    if (body.plan === 'streamer') {
      updates.lemon_squeezy_variant_id = process.env.LEMON_SQUEEZY_STREAMER_VARIANT_ID?.trim() ?? null
    }

    if (foundingCreator) {
      updates.is_founding_creator = true
      updates.founding_enrolled_at = nowIso
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
            updated_at: nowIso,
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
          warning:
            'plan stored as vip because DB constraint missing streamer. Run migration 20260623_repair_streamer_plan.sql then POST /api/admin/repair-streamer-plans',
          foundingCreator: foundingCreator,
          vipUntilApplied: updates.vip_until ?? null,
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
        metadata: {
          note: body.note ?? (foundingCreator ? 'founding_creator' : 'wechat_manual'),
          source: foundingCreator ? 'founding_creator' : 'wechat_manual',
        },
      })
    }

    return NextResponse.json({
      success: true,
      profile,
      foundingCreator: foundingCreator,
      vipUntilApplied: updates.vip_until ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown grant error'
    return jsonError(message, 500)
  }
}
