import type { AlarmConfig, PomodoroConfig, PomodoroState } from '@/lib/companion/types'
import { DEFAULT_POMODORO_CONFIG } from '@/lib/companion/types'

const ALARMS_KEY = 'timeloop-companion-alarms'
const POMODORO_KEY = 'timeloop-companion-pomodoro'
const POMODORO_CONFIG_KEY = 'timeloop-companion-pomodoro-config'
const CALENDAR_NOTIFIED_KEY = 'timeloop-calendar-notified-ids'

export function loadAlarms(): AlarmConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ALARMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as AlarmConfig[]) : []
  } catch {
    return []
  }
}

export function saveAlarms(alarms: AlarmConfig[]) {
  localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms))
}

export function loadPomodoroState(): PomodoroState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(POMODORO_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PomodoroState
  } catch {
    return null
  }
}

export function savePomodoroState(state: PomodoroState) {
  localStorage.setItem(POMODORO_KEY, JSON.stringify(state))
}

export function loadPomodoroConfig(): PomodoroConfig {
  if (typeof window === 'undefined') return DEFAULT_POMODORO_CONFIG
  try {
    const raw = localStorage.getItem(POMODORO_CONFIG_KEY)
    if (!raw) return DEFAULT_POMODORO_CONFIG
    return { ...DEFAULT_POMODORO_CONFIG, ...(JSON.parse(raw) as PomodoroConfig) }
  } catch {
    return DEFAULT_POMODORO_CONFIG
  }
}

export function loadCalendarNotifiedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(CALENDAR_NOTIFIED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : [])
  } catch {
    return new Set()
  }
}

export function saveCalendarNotifiedIds(ids: Set<string>) {
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem(CALENDAR_NOTIFIED_KEY, JSON.stringify([...ids].slice(-50)))
  void today
}

export function pruneCalendarNotifiedForToday(): Set<string> {
  const ids = loadCalendarNotifiedIds()
  return ids
}
