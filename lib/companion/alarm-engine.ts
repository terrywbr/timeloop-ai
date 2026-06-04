import type { AlarmConfig, AlarmRepeat } from '@/lib/companion/types'

function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

function matchesRepeat(alarm: AlarmConfig, now: Date): boolean {
  if (alarm.repeat === 'daily') return true
  if (alarm.repeat === 'weekdays') return isWeekday(now)
  return true
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local calendar date (not UTC). */
export function localDateKey(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** Local minute bucket for deduplication. */
export function alarmFireKey(now: Date): string {
  return `${localDateKey(now)}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`
}

export function shouldFireAlarm(alarm: AlarmConfig, now = new Date()): boolean {
  if (!alarm.enabled) return false
  if (alarm.hour !== now.getHours() || alarm.minute !== now.getMinutes()) return false
  if (!matchesRepeat(alarm, now)) return false

  const key = alarmFireKey(now)

  if (alarm.repeat === 'once') {
    if (alarm.lastFiredMinute || alarm.lastFiredDate) return false
    return true
  }

  if (alarm.lastFiredMinute === key) return false

  // Legacy: same local day already fired (daily/weekdays)
  if (alarm.lastFiredDate === localDateKey(now) && !alarm.lastFiredMinute) return false

  return true
}

export function markAlarmFired(alarm: AlarmConfig, now = new Date()): AlarmConfig {
  const key = alarmFireKey(now)
  return {
    ...alarm,
    lastFiredMinute: key,
    lastFiredDate: localDateKey(now),
  }
}

export function formatAlarmTime(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`
}

export function createAlarm(partial: Pick<AlarmConfig, 'hour' | 'minute'> & Partial<AlarmConfig>): AlarmConfig {
  return {
    id: partial.id ?? `alarm-${Date.now()}`,
    label: partial.label ?? 'Alarm',
    hour: partial.hour,
    minute: partial.minute,
    repeat: partial.repeat ?? 'once',
    enabled: partial.enabled ?? true,
  }
}

export function repeatLabel(repeat: AlarmRepeat): string {
  switch (repeat) {
    case 'daily':
      return 'daily'
    case 'weekdays':
      return 'weekdays'
    default:
      return 'once'
  }
}
