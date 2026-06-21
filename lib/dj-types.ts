import type { MusicMoodId } from '@/lib/music-moods'

export type DjSessionType =
  | 'enter'
  | 'return'
  | 'interval'
  | 'cofocus'

export type DjSpeakContext = {
  coFocusCount?: number
}

export type DjSpeakParams = {
  moodId: MusicMoodId
  sessionType: DjSessionType
  stationName?: string
  context?: DjSpeakContext
  force?: boolean
}

export const DJ_INTERVAL_MS = 20 * 60 * 1000
