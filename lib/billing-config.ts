const CORE_BILLING_ENV_VARS = [
  'LEMON_SQUEEZY_API_KEY',
  'LEMON_SQUEEZY_STORE_ID',
  'LEMON_SQUEEZY_VIP_VARIANT_ID',
] as const

const CREDIT_PACK_ENV_VARS = [
  'LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID',
  'LEMON_SQUEEZY_CREDIT_PACK_10_VARIANT_ID',
  'LEMON_SQUEEZY_CREDIT_PACK_20_VARIANT_ID',
] as const

export type CheckoutProductKind = 'vip' | 'streamer' | 'credits' | 'credits_10' | 'credits_20'

export function getMissingBillingEnvVars(): string[] {
  const missing: string[] = CORE_BILLING_ENV_VARS.filter((name) => !process.env[name]?.trim())
  const hasAnyCreditPack = CREDIT_PACK_ENV_VARS.some((name) => Boolean(process.env[name]?.trim()))
  if (!hasAnyCreditPack) {
    missing.push('LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID')
  }
  return missing
}

export function isBillingConfigured() {
  return getMissingBillingEnvVars().length === 0
}

export function isStreamerCheckoutConfigured() {
  return Boolean(process.env.LEMON_SQUEEZY_STREAMER_VARIANT_ID?.trim())
}

export function billingNotConfiguredMessage() {
  return '付費功能尚未完成設定，請稍後再試或聯繫管理員。'
}

export function getConfiguredCreditPackVariants(): Array<{ kind: CheckoutProductKind; variantId: string; credits: number }> {
  const packs: Array<{ kind: CheckoutProductKind; variantId: string; credits: number }> = []
  const legacy = process.env.LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID?.trim()
  if (legacy) {
    const credits = Number.parseInt(process.env.LEMON_SQUEEZY_CREDIT_PACK_CREDITS ?? '100', 10)
    packs.push({ kind: 'credits', variantId: legacy, credits: Number.isFinite(credits) ? credits : 100 })
  }
  const small = process.env.LEMON_SQUEEZY_CREDIT_PACK_10_VARIANT_ID?.trim()
  if (small) packs.push({ kind: 'credits_10', variantId: small, credits: 10 })
  const large = process.env.LEMON_SQUEEZY_CREDIT_PACK_20_VARIANT_ID?.trim()
  if (large) packs.push({ kind: 'credits_20', variantId: large, credits: 20 })
  return packs
}

export function resolveCreditPackByKind(kind: CheckoutProductKind) {
  return getConfiguredCreditPackVariants().find((pack) => pack.kind === kind) ?? null
}

export function resolveCreditPackByVariantId(variantId: string | null | undefined) {
  if (!variantId) return null
  return getConfiguredCreditPackVariants().find((pack) => pack.variantId === variantId) ?? null
}
