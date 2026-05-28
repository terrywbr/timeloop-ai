import type { PublicGeneratedWorld } from './supabase-types'

export type UserAccountProfile = {
  id: string
  email: string | null
  displayName: string | null
  plan: 'free' | 'vip'
  vipStatus: string
  vipUntil: string | null
  isVip: boolean
  remainingCredits: number
  monthlyGenerationLimit: number
  creditsResetAt: string
}

type ApiErrorResponse = {
  success: false
  error: string
}

function authHeaders(accessToken: string | null | undefined) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return headers
}

export async function fetchUserProfile(accessToken: string): Promise<UserAccountProfile | null> {
  const response = await fetch('/api/me', {
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true; profile: UserAccountProfile } | ApiErrorResponse
  if (!response.ok || !payload.success) return null
  return payload.profile
}

export async function fetchWorlds(accessToken?: string | null): Promise<{
  featured: PublicGeneratedWorld[]
  own: PublicGeneratedWorld[]
}> {
  const response = await fetch('/api/worlds', {
    headers: authHeaders(accessToken ?? null),
  })
  const payload = (await response.json()) as
    | { success: true; featured: PublicGeneratedWorld[]; own: PublicGeneratedWorld[] }
    | ApiErrorResponse

  if (!response.ok || !payload.success) {
    return { featured: [], own: [] }
  }

  return {
    featured: payload.featured,
    own: payload.own,
  }
}

export async function startCheckout(
  accessToken: string,
  kind: 'subscription' | 'credits',
): Promise<string | null> {
  const response = await fetch('/api/checkout/lemonsqueezy', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ kind }),
  })
  const payload = (await response.json()) as { success: true; checkoutUrl: string } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Checkout failed' : payload.error
    throw new Error(message)
  }
  return payload.checkoutUrl
}

export async function deleteWorld(accessToken: string, worldId: string) {
  const response = await fetch(`/api/worlds/${worldId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Delete failed' : payload.error
    throw new Error(message)
  }
}

export async function updateWorldTitle(accessToken: string, worldId: string, title: string) {
  const response = await fetch(`/api/worlds/${worldId}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ title }),
  })
  const payload = (await response.json()) as { success: true } | ApiErrorResponse
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Update failed' : payload.error
    throw new Error(message)
  }
}
