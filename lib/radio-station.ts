import type { MusicMoodId } from '@/lib/music-moods'
import { MUSIC_MOOD_BY_ID } from '@/lib/music-moods'

export type RadioStation = {
  stationuuid: string
  name: string
  urlResolved: string
  moodId?: MusicMoodId
  tags?: string
  country?: string
}

export const MUSIC_ONBOARDED_KEY = 'timeloop-music-onboarded'
export const MUSIC_MOODS_KEY = 'timeloop-music-moods'
export const MUSIC_FAVORITES_KEY = 'musicFavorites'

export function computeDisplayFreq(stationuuid: string): string {
  let hash = 0
  for (let i = 0; i < stationuuid.length; i++) {
    hash = (hash * 31 + stationuuid.charCodeAt(i)) >>> 0
  }
  const freq = 88 + (hash % 2001) / 100
  return freq.toFixed(1)
}

export function toRadioStation(
  raw: {
    stationuuid: string
    name: string
    urlResolved: string
    moodId?: MusicMoodId
    tags?: string
    country?: string
  },
): RadioStation {
  return {
    stationuuid: raw.stationuuid,
    name: raw.name,
    urlResolved: raw.urlResolved,
    moodId: raw.moodId,
    tags: raw.tags,
    country: raw.country,
  }
}

export function defaultStationForMood(moodId: MusicMoodId): RadioStation {
  const mood = MUSIC_MOOD_BY_ID[moodId]
  const def = mood.defaultStation
  return toRadioStation({
    stationuuid: def.stationuuid,
    name: def.name,
    urlResolved: def.urlResolved,
    moodId,
  })
}

export function isDefaultStation(stationuuid: string): boolean {
  return stationuuid.startsWith('default-')
}

export function pickInitialStation(moodIds: MusicMoodId[]): RadioStation {
  const moodId = moodIds[0] ?? 'deep-night'
  return defaultStationForMood(moodId)
}

/** Build proxied playback URL (fallback for CN or when direct fails). */
export function buildProxiedStreamUrl(station: RadioStation): string {
  if (station.stationuuid.startsWith('default-')) {
    return `/api/stream?url=${encodeURIComponent(station.urlResolved)}`
  }
  return `/api/stream?uuid=${encodeURIComponent(station.stationuuid)}&url=${encodeURIComponent(station.urlResolved)}`
}

/** Prefer direct stream URLs — HTML audio does not need CORS and avoids Worker proxy timeouts. */
export function buildStreamPlaybackUrl(station: RadioStation, preferProxy = false): string {
  if (preferProxy) return buildProxiedStreamUrl(station)
  return station.urlResolved
}

export function isStreamUrlForStation(station: RadioStation, playbackUrl: string): boolean {
  return (
    playbackUrl === station.urlResolved ||
    playbackUrl === buildProxiedStreamUrl(station)
  )
}

export function shouldPreferStreamProxy(): boolean {
  if (typeof window === 'undefined') return false
  if (window.location.hostname.startsWith('cn.') || window.location.hostname === 'cn.localhost') {
    return true
  }
  return localStorage.getItem('timeloop-region') === 'cn'
}

export function loadSelectedMoods(): MusicMoodId[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MUSIC_MOODS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is MusicMoodId => typeof id === 'string')
  } catch {
    return []
  }
}

export function saveSelectedMoods(moodIds: MusicMoodId[]) {
  localStorage.setItem(MUSIC_MOODS_KEY, JSON.stringify(moodIds))
}

export function isMusicOnboarded(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(MUSIC_ONBOARDED_KEY) === '1'
}

export function markMusicOnboarded() {
  localStorage.setItem(MUSIC_ONBOARDED_KEY, '1')
}

export function clearMusicOnboarding() {
  localStorage.removeItem(MUSIC_ONBOARDED_KEY)
}

function isLegacyFavoriteEntry(value: unknown): value is string {
  return typeof value === 'string'
}

function isRadioStationEntry(value: unknown): value is RadioStation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stationuuid' in value &&
    'name' in value &&
    'urlResolved' in value
  )
}

export function loadFavoriteStations(): RadioStation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MUSIC_FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    if (parsed.some(isLegacyFavoriteEntry)) {
      localStorage.removeItem(MUSIC_FAVORITES_KEY)
      return []
    }

    return parsed.filter(isRadioStationEntry)
  } catch {
    return []
  }
}

export function saveFavoriteStations(stations: RadioStation[]) {
  localStorage.setItem(MUSIC_FAVORITES_KEY, JSON.stringify(stations))
}

export function toggleFavoriteStation(
  favorites: RadioStation[],
  station: RadioStation,
): RadioStation[] {
  const exists = favorites.some((f) => f.stationuuid === station.stationuuid)
  if (exists) {
    return favorites.filter((f) => f.stationuuid !== station.stationuuid)
  }
  return [...favorites, station]
}
