import { isMusicMoodId, type MusicMoodId } from '@/lib/music-moods'

export const DJ_VOICE_ENABLED_KEY = 'timeloop-dj-voice-enabled'
export const DJ_LAST_GREET_DATE_KEY = 'timeloop-dj-last-greet-date'
export const DJ_INTERVAL_ENABLED_KEY = 'timeloop-dj-interval-enabled'
export const DJ_LAST_INTERVAL_AT_KEY = 'timeloop-dj-last-interval-at'
export const PRIMARY_MOOD_KEY = 'timeloop-primary-mood'

export function loadDjVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(DJ_VOICE_ENABLED_KEY)
  if (stored === '0') return false
  return true
}

export function saveDjVoiceEnabled(enabled: boolean) {
  localStorage.setItem(DJ_VOICE_ENABLED_KEY, enabled ? '1' : '0')
}

export function loadIntervalEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(DJ_INTERVAL_ENABLED_KEY)
  if (stored === '0') return false
  return true
}

export function saveIntervalEnabled(enabled: boolean) {
  localStorage.setItem(DJ_INTERVAL_ENABLED_KEY, enabled ? '1' : '0')
}

export function getLastIntervalAt(): number {
  if (typeof window === 'undefined') return 0
  const raw = localStorage.getItem(DJ_LAST_INTERVAL_AT_KEY)
  const n = raw ? Number.parseInt(raw, 10) : 0
  return Number.isFinite(n) ? n : 0
}

export function markIntervalSpoken(at = Date.now()) {
  localStorage.setItem(DJ_LAST_INTERVAL_AT_KEY, String(at))
}

export function shouldSpeakInterval(now: number, intervalMs: number): boolean {
  const last = getLastIntervalAt()
  if (last === 0) {
    markIntervalSpoken(now)
    return false
  }
  return now - last >= intervalMs
}

export function shouldGreetToday(): boolean {
  if (typeof window === 'undefined') return true
  const today = new Date().toISOString().slice(0, 10)
  return localStorage.getItem(DJ_LAST_GREET_DATE_KEY) !== today
}

export function markGreetedToday() {
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem(DJ_LAST_GREET_DATE_KEY, today)
}

export function clearGreetDate() {
  localStorage.removeItem(DJ_LAST_GREET_DATE_KEY)
}

export function loadPrimaryMood(): MusicMoodId | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PRIMARY_MOOD_KEY)
  if (!raw || !isMusicMoodId(raw)) return null
  return raw
}

export function savePrimaryMood(moodId: MusicMoodId) {
  localStorage.setItem(PRIMARY_MOOD_KEY, moodId)
}
