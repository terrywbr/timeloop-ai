import {
  billingNotConfiguredMessage,
  isBillingConfigured,
  resolveCreditPackByKind,
  type CheckoutProductKind,
} from '@/lib/billing-config'

export type CheckoutKind = CheckoutProductKind

export type LemonSqueezyPayload = {
  meta?: {
    event_name?: string
    custom_data?: Record<string, unknown>
  }
  data?: {
    id?: string
    type?: string
    attributes?: Record<string, unknown>
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'http://localhost:3000'
  )
}

export function getVariantId(kind: CheckoutKind) {
  if (kind === 'vip') return requiredEnv('LEMON_SQUEEZY_VIP_VARIANT_ID')
  if (kind === 'streamer') {
    const streamerVariant = process.env.LEMON_SQUEEZY_STREAMER_VARIANT_ID?.trim()
    if (!streamerVariant) throw new Error('Streamer Pass checkout is not configured')
    return streamerVariant
  }
  const pack = resolveCreditPackByKind(kind)
  if (!pack) throw new Error(`Credit pack checkout is not configured for ${kind}`)
  return pack.variantId
}

export function getCreditPackCreditsForKind(kind: CheckoutKind) {
  const pack = resolveCreditPackByKind(kind)
  return pack?.credits ?? 0
}

/** @deprecated use getCreditPackCreditsForKind */
export function getCreditPackCredits() {
  const pack = resolveCreditPackByKind('credits')
  return pack?.credits ?? 100
}

export function resolveSubscriptionPlanFromVariant(variantId: string | null): 'vip' | 'streamer' {
  const streamerVariant = process.env.LEMON_SQUEEZY_STREAMER_VARIANT_ID?.trim()
  if (streamerVariant && variantId === streamerVariant) return 'streamer'
  return 'vip'
}

export async function createLemonSqueezyCheckout({
  kind,
  userId,
  email,
}: {
  kind: CheckoutKind
  userId: string
  email?: string | null
}) {
  if (!isBillingConfigured()) {
    throw new Error(billingNotConfiguredMessage())
  }

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requiredEnv('LEMON_SQUEEZY_API_KEY')}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: email ?? undefined,
            custom: {
              user_id: userId,
              checkout_kind: kind,
            },
          },
          product_options: {
            redirect_url: `${getSiteUrl()}/?checkout=success`,
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: requiredEnv('LEMON_SQUEEZY_STORE_ID'),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: getVariantId(kind),
            },
          },
        },
      },
    }),
  })

  const payload = (await response.json()) as {
    data?: { attributes?: { url?: string } }
    errors?: Array<{ detail?: string; title?: string }>
  }

  if (!response.ok) {
    const message = payload.errors?.[0]?.detail ?? payload.errors?.[0]?.title ?? 'Lemon Squeezy checkout failed'
    throw new Error(message)
  }

  const checkoutUrl = payload.data?.attributes?.url
  if (!checkoutUrl) throw new Error('Lemon Squeezy did not return a checkout URL')
  return checkoutUrl
}

export function lemonEventId(payload: LemonSqueezyPayload) {
  const eventName = payload.meta?.event_name ?? 'unknown'
  const id = payload.data?.id ?? crypto.randomUUID()
  return `${eventName}:${id}`
}

export function lemonCustomData(payload: LemonSqueezyPayload) {
  const attributes = payload.data?.attributes ?? {}
  const attrCustom = attributes.custom_data
  if (attrCustom && typeof attrCustom === 'object') return attrCustom as Record<string, unknown>
  return payload.meta?.custom_data ?? {}
}

export function lemonStringAttribute(payload: LemonSqueezyPayload, key: string) {
  const value = payload.data?.attributes?.[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return null
}
