import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import {
  getCreditPackCredits,
  getVariantId,
  lemonCustomData,
  lemonEventId,
  lemonStringAttribute,
  type LemonSqueezyPayload,
} from '@/lib/lemon-squeezy'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing required environment variable: LEMON_SQUEEZY_WEBHOOK_SECRET')
  if (!signature) return false

  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

function normalizeVipStatus(status: string | null) {
  switch (status) {
    case 'active':
    case 'past_due':
    case 'cancelled':
    case 'paused':
    case 'expired':
      return status
    default:
      return 'inactive'
  }
}

async function resolveUserId(payload: LemonSqueezyPayload, subscriptionId?: string | null) {
  const customData = lemonCustomData(payload)
  const customUserId = customData.user_id
  if (typeof customUserId === 'string' && customUserId.length > 0) return customUserId

  if (!subscriptionId) return null
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('lemon_squeezy_subscription_id', subscriptionId)
    .maybeSingle<{ id: string }>()

  return data?.id ?? null
}

async function recordWebhookEvent(payload: LemonSqueezyPayload) {
  const supabase = createSupabaseAdminClient()
  const eventId = lemonEventId(payload)
  const { data: existing } = await supabase
    .from('lemon_squeezy_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle<{ id: string }>()

  if (existing) return { duplicate: true, eventId }

  const { error } = await supabase
    .from('lemon_squeezy_events')
    .insert({
      event_id: eventId,
      event_name: payload.meta?.event_name ?? 'unknown',
      order_id: payload.data?.type === 'orders' ? payload.data.id ?? null : null,
      subscription_id: payload.data?.type === 'subscriptions' ? payload.data.id ?? null : null,
      payload,
    })

  if (error) throw error
  return { duplicate: false, eventId }
}

async function handleCreditPackPurchase(payload: LemonSqueezyPayload, eventId: string) {
  const eventName = payload.meta?.event_name
  if (eventName !== 'order_created') return

  const customData = lemonCustomData(payload)
  const variantId = lemonStringAttribute(payload, 'variant_id')
  const isCreditCheckout = customData.checkout_kind === 'credits'
    || variantId === process.env.LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID
  if (!isCreditCheckout) return

  const userId = typeof customData.user_id === 'string' ? customData.user_id : null
  if (!userId) throw new Error('Credit pack order is missing custom user_id')

  const orderId = payload.data?.id
  if (!orderId) throw new Error('Credit pack order is missing order id')

  const credits = getCreditPackCredits()
  const supabase = createSupabaseAdminClient()

  const { data: existingPurchase } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('lemon_squeezy_order_id', orderId)
    .eq('type', 'purchase')
    .maybeSingle<{ id: string }>()

  if (existingPurchase) return

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('remaining_credits')
    .eq('id', userId)
    .single<{ remaining_credits: number }>()

  if (profileError) throw profileError

  const balanceAfter = (profile?.remaining_credits ?? 0) + credits
  const { error: userError } = await supabase
    .from('users')
    .update({ remaining_credits: balanceAfter })
    .eq('id', userId)

  if (userError) throw userError

  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: credits,
      balance_after: balanceAfter,
      type: 'purchase',
      source: 'lemon_squeezy',
      lemon_squeezy_order_id: orderId,
      lemon_squeezy_event_id: eventId,
      metadata: payload,
    })

  if (txError) throw txError
}

async function handleSubscriptionEvent(payload: LemonSqueezyPayload) {
  const eventName = payload.meta?.event_name ?? ''
  if (!eventName.startsWith('subscription_')) return

  const subscriptionId = payload.data?.id ?? null
  const userId = await resolveUserId(payload, subscriptionId)
  if (!userId) throw new Error('Subscription event is missing user_id')

  const status = normalizeVipStatus(lemonStringAttribute(payload, 'status'))
  const variantId = lemonStringAttribute(payload, 'variant_id') ?? getVariantId('subscription')
  const customerId = lemonStringAttribute(payload, 'customer_id')
  const subscriptionItemId = lemonStringAttribute(payload, 'first_subscription_item_id')
  const renewsAt = lemonStringAttribute(payload, 'renews_at')
  const endsAt = lemonStringAttribute(payload, 'ends_at')
  const vipUntil = renewsAt ?? endsAt
  const isActiveVip = status === 'active' || status === 'past_due'
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase
    .from('users')
    .update({
      plan: isActiveVip ? 'vip' : 'free',
      vip_status: status,
      vip_until: vipUntil,
      lemon_squeezy_customer_id: customerId,
      lemon_squeezy_subscription_id: subscriptionId,
      lemon_squeezy_subscription_item_id: subscriptionItemId,
      lemon_squeezy_variant_id: variantId,
    })
    .eq('id', userId)

  if (error) throw error
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    if (!verifySignature(rawBody, req.headers.get('x-signature'))) {
      return jsonError('Invalid Lemon Squeezy signature', 401)
    }

    const payload = JSON.parse(rawBody) as LemonSqueezyPayload
    const recorded = await recordWebhookEvent(payload)
    if (recorded.duplicate) {
      return NextResponse.json({ success: true, duplicate: true })
    }

    await handleCreditPackPurchase(payload, recorded.eventId)
    await handleSubscriptionEvent(payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Lemon Squeezy webhook error'
    console.error('[lemonsqueezy webhook]', error)
    return jsonError(message, 500)
  }
}
