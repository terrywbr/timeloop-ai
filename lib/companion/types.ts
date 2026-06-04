export type PomodoroPhase = 'idle' | 'focus' | 'short_break' | 'long_break'

export type PomodoroConfig = {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
}

export type PomodoroState = {
  phase: PomodoroPhase
  remainingSeconds: number
  completedFocusCycles: number
  isRunning: boolean
}

export type AlarmRepeat = 'once' | 'daily' | 'weekdays'

export type AlarmConfig = {
  id: string
  label: string
  hour: number
  minute: number
  repeat: AlarmRepeat
  enabled: boolean
  /** @deprecated use lastFiredMinute */
  lastFiredDate?: string
  /** Local YYYY-MM-DDTHH:mm — prevents double-fire within the same minute */
  lastFiredMinute?: string
}

export type CompanionEvent =
  | { type: 'pomodoro'; phase: PomodoroPhase; previousPhase: PomodoroPhase }
  | { type: 'alarm'; alarm: AlarmConfig }
  | { type: 'calendar'; eventTitle: string; minutesUntil: number }

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
}
