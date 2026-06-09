/** Standard AI scene generation (Together + Replicate depth). */
export const GENERATION_CREDIT_COST_STANDARD = 10

/** Premium / high-cost generation tier (reserved for Phase 2+). */
export const GENERATION_CREDIT_COST_PREMIUM = 20

export type GenerationCreditTier = 'standard' | 'premium'

export function getGenerationCreditCost(tier: GenerationCreditTier = 'standard') {
  return tier === 'premium' ? GENERATION_CREDIT_COST_PREMIUM : GENERATION_CREDIT_COST_STANDARD
}

export function hasUnlimitedGeneration(plan: string, isVip: boolean, isStreamer: boolean) {
  return isVip || isStreamer || plan === 'vip' || plan === 'streamer'
}
