export const REGION_STORAGE_KEY = 'timeloop-region'
export const GEO_COUNTRY_KEY = 'timeloop-geo-country'
export const GEO_FETCHED_AT_KEY = 'timeloop-geo-fetched-at'
export const GEO_UPDATED_EVENT = 'timeloop-geo-updated'

const GEO_TTL_MS = 24 * 60 * 60 * 1000

export type GeoApiResponse = {
  country: string
  suggestCn: boolean
}

export function getCachedGeoCountry(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(GEO_COUNTRY_KEY)
}

export function setCachedGeoCountry(country: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GEO_COUNTRY_KEY, country)
  localStorage.setItem(GEO_FETCHED_AT_KEY, String(Date.now()))
}

export function isCachedGeoExpired(): boolean {
  if (typeof window === 'undefined') return true
  const raw = localStorage.getItem(GEO_FETCHED_AT_KEY)
  if (!raw) return true
  const fetchedAt = Number.parseInt(raw, 10)
  if (!Number.isFinite(fetchedAt)) return true
  return Date.now() - fetchedAt > GEO_TTL_MS
}

export function getStoredRegionPreference(): 'global' | 'cn' | null {
  if (typeof window === 'undefined') return null
  const value = localStorage.getItem(REGION_STORAGE_KEY)
  if (value === 'global' || value === 'cn') return value
  return null
}

export function notifyGeoUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(GEO_UPDATED_EVENT))
}

export async function fetchGeoFromApi(): Promise<GeoApiResponse | null> {
  try {
    const response = await fetch('/api/geo', { cache: 'no-store' })
    if (!response.ok) return null
    const payload = (await response.json()) as { success?: boolean; country?: string; suggestCn?: boolean }
    if (!payload.success || typeof payload.country !== 'string') return null
    return {
      country: payload.country,
      suggestCn: Boolean(payload.suggestCn),
    }
  } catch {
    return null
  }
}

export async function resolveGeoCountry(): Promise<string | null> {
  if (!isCachedGeoExpired()) {
    return getCachedGeoCountry()
  }

  const fromApi = await fetchGeoFromApi()
  if (fromApi) {
    setCachedGeoCountry(fromApi.country)
    return fromApi.country
  }

  return getCachedGeoCountry()
}
