import type { NextRequest } from 'next/server'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function liveNetworkSessionKey(req: NextRequest, userId: string | null) {
  if (userId) return `user:${userId}`
  const guest = req.headers.get('x-live-network-guest')?.trim()
  if (guest && guest.length <= 64) return `guest:${guest}`
  return null
}

export function sanitizeLiveNetworkField(value: unknown, maxLen: number, fallback: string) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.slice(0, maxLen)
}
