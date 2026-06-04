import type { MusicMoodId } from '@/lib/music-moods'

export type DjSessionType =
  | 'enter'
  | 'return'
  | 'interval'
  | 'pomodoro'
  | 'alarm'
  | 'calendar'
  | 'cofocus'

export type DjSpeakContext = {
  phase?: string
  remainingMinutes?: number
  alarmLabel?: string
  eventTitle?: string
  minutesUntil?: number
  pomodoroCycle?: number
  coFocusCount?: number
}

export type DjSpeakParams = {
  moodId: MusicMoodId
  sessionType: DjSessionType
  stationName?: string
  context?: DjSpeakContext
  force?: boolean
}

export const DJ_INTERVAL_MS = 1 * 60 * 1000
