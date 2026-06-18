const CORE_BILLING_ENV_VARS = ['LEMON_SQUEEZY_API_KEY', 'LEMON_SQUEEZY_STORE_ID'] as const

const CREDIT_PACK_ENV_VARS = ['LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID'] as const

export type CheckoutProductKind = 'vip' | 'streamer' | 'credits'

function isEnvSet(name: string) {
  return Boolean(process.env[name]?.trim())
}

export function getMissingBillingCoreEnvVars(): string[] {
  return CORE_BILLING_ENV_VARS.filter((name) => !isEnvSet(name))
}

export function getMissingCheckoutEnvVars(kind: CheckoutProductKind): string[] {
  const missing: string[] = [...getMissingBillingCoreEnvVars()]
  if (kind === 'vip' && !isEnvSet('LEMON_SQUEEZY_VIP_VARIANT_ID')) {
    missing.push('LEMON_SQUEEZY_VIP_VARIANT_ID')
  }
  if (kind === 'streamer' && !isEnvSet('LEMON_SQUEEZY_STREAMER_VARIANT_ID')) {
    missing.push('LEMON_SQUEEZY_STREAMER_VARIANT_ID')
  }
  if (kind === 'credits') {
    const hasAnyCreditPack = CREDIT_PACK_ENV_VARS.some((name) => isEnvSet(name))
    if (!hasAnyCreditPack) {
      missing.push('LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID')
    }
  }
  return missing
}

export function getMissingBillingEnvVars(): string[] {
  return getMissingBillingCoreEnvVars()
}

export function isBillingConfigured() {
  return getMissingBillingCoreEnvVars().length === 0
}

export function isVipCheckoutConfigured() {
  return getMissingCheckoutEnvVars('vip').length === 0
}

export function isStreamerCheckoutConfigured() {
  return getMissingCheckoutEnvVars('streamer').length === 0
}

export function isCreditsCheckoutConfigured() {
  return getMissingCheckoutEnvVars('credits').length === 0
}

export function isCheckoutConfigured(kind: CheckoutProductKind) {
  return getMissingCheckoutEnvVars(kind).length === 0
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
  return packs
}

export function resolveCreditPackByKind(kind: CheckoutProductKind) {
  return getConfiguredCreditPackVariants().find((pack) => pack.kind === kind) ?? null
}

export function resolveCreditPackByVariantId(variantId: string | null | undefined) {
  if (!variantId) return null
  return getConfiguredCreditPackVariants().find((pack) => pack.variantId === variantId) ?? null
}
