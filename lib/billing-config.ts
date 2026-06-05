const BILLING_ENV_VARS = [
  'LEMON_SQUEEZY_API_KEY',
  'LEMON_SQUEEZY_STORE_ID',
  'LEMON_SQUEEZY_VIP_VARIANT_ID',
  'LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID',
] as const

export function getMissingBillingEnvVars(): string[] {
  return BILLING_ENV_VARS.filter((name) => !process.env[name]?.trim())
}

export function isBillingConfigured() {
  return getMissingBillingEnvVars().length === 0
}

export function billingNotConfiguredMessage() {
  return '付費功能尚未完成設定，請稍後再試或聯繫管理員。'
}
