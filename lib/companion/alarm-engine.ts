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

function todayKey(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export function shouldFireAlarm(alarm: AlarmConfig, now = new Date()): boolean {
  if (!alarm.enabled) return false
  if (alarm.hour !== now.getHours() || alarm.minute !== now.getMinutes()) return false
  if (!matchesRepeat(alarm, now)) return false

  const fired = alarm.lastFiredDate === todayKey(now)
  if (alarm.repeat === 'once' && fired) return false
  if (alarm.repeat !== 'once' && fired) return false

  return true
}

export function markAlarmFired(alarm: AlarmConfig, now = new Date()): AlarmConfig {
  return { ...alarm, lastFiredDate: todayKey(now) }
}

export function formatAlarmTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
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
