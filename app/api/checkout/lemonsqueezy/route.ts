import { NextResponse } from 'next/server'
import {
  billingNotConfiguredMessage,
  isBillingConfigured,
  isStreamerCheckoutConfigured,
  type CheckoutProductKind,
} from '@/lib/billing-config'
import { createLemonSqueezyCheckout } from '@/lib/lemon-squeezy'
import { getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

const CHECKOUT_KINDS: CheckoutProductKind[] = ['vip', 'streamer', 'credits']

function isCheckoutKind(value: unknown): value is CheckoutProductKind {
  return typeof value === 'string' && CHECKOUT_KINDS.includes(value as CheckoutProductKind)
}

function normalizeCheckoutKind(raw: unknown): CheckoutProductKind {
  if (raw === 'subscription') return 'vip'
  if (isCheckoutKind(raw)) return raw
  return 'vip'
}

export async function POST(req: Request) {
  try {
    if (!isBillingConfigured()) {
      return jsonError(billingNotConfiguredMessage(), 503)
    }

    const auth = await getAuthenticatedUser(req)
    const body = (await req.json()) as { kind?: unknown }
    const kind = normalizeCheckoutKind(body.kind)

    if (kind === 'streamer' && !isStreamerCheckoutConfigured()) {
      return jsonError('Streamer Pass 自助購買尚未開放，請聯繫客服。', 503)
    }

    const checkoutUrl = await createLemonSqueezyCheckout({
      kind,
      userId: auth.user.id,
      email: auth.user.email,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
