import { NextResponse } from 'next/server'
import { createLemonSqueezyCheckout, type CheckoutKind } from '@/lib/lemon-squeezy'
import { getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function isCheckoutKind(value: unknown): value is CheckoutKind {
  return value === 'subscription' || value === 'credits'
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const body = (await req.json()) as { kind?: unknown }
    const kind = isCheckoutKind(body.kind) ? body.kind : 'subscription'
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
