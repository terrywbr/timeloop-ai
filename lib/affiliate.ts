const AFFILIATE_STORAGE_KEY = 'timeloop-aff'
const AFFILIATE_TTL_MS = 30 * 24 * 60 * 60 * 1000

type StoredAffiliate = {
  slug: string
  capturedAt: number
}

export function normalizeAffiliateSlug(raw: string | null | undefined): string | null {
  if (!raw) return null
  const slug = raw.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9_-]{1,48}$/.test(slug)) return null
  return slug
}

export function readAffiliateSlugFromSearch(search: string): string | null {
  const params = new URLSearchParams(search)
  return normalizeAffiliateSlug(params.get('aff'))
}

function readStoredAffiliate(): StoredAffiliate | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AFFILIATE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAffiliate
    if (!parsed?.slug || typeof parsed.capturedAt !== 'number') return null
    if (Date.now() - parsed.capturedAt > AFFILIATE_TTL_MS) {
      window.localStorage.removeItem(AFFILIATE_STORAGE_KEY)
      return null
    }
    return { slug: parsed.slug, capturedAt: parsed.capturedAt }
  } catch {
    return null
  }
}

export function getStoredAffiliateSlug(): string | null {
  return readStoredAffiliate()?.slug ?? null
}

export function captureAffiliateSlug(search?: string): string | null {
  if (typeof window === 'undefined') return null

  const fromUrl = readAffiliateSlugFromSearch(search ?? window.location.search)
  if (fromUrl) {
    const payload: StoredAffiliate = { slug: fromUrl, capturedAt: Date.now() }
    window.localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(payload))
    return fromUrl
  }

  return getStoredAffiliateSlug()
}

export function clearStoredAffiliateSlug() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AFFILIATE_STORAGE_KEY)
}
