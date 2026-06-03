'use client'

import { useState } from 'react'
import { AlarmClock, Calendar, Play, Pause, RotateCcw, SkipForward, Trash2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { getPomodoroPhaseLabel } from '@/lib/companion-i18n'
import { formatAlarmTime } from '@/lib/companion/alarm-engine'
import type { AlarmConfig, PomodoroState } from '@/lib/companion/types'
import type { CalendarEventItem } from '@/hooks/use-google-calendar'

type CompanionPanelProps = {
  pomodoro: PomodoroState
  onStartPomodoro: () => void
  onPausePomodoro: () => void
  onResetPomodoro: () => void
  onSkipPomodoro: () => void
  alarms: AlarmConfig[]
  onAddAlarm: (hour: number, minute: number, repeat: AlarmConfig['repeat']) => void
  onRemoveAlarm: (id: string) => void
  onToggleAlarm: (id: string) => void
  calendarEvents: CalendarEventItem[]
  calendarConnected: boolean
  calendarLoading: boolean
  isAuthenticated: boolean
  onConnectCalendar: () => void
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatEventTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function CompanionPanel({
  pomodoro,
  onStartPomodoro,
  onPausePomodoro,
  onResetPomodoro,
  onSkipPomodoro,
  alarms,
  onAddAlarm,
  onRemoveAlarm,
  onToggleAlarm,
  calendarEvents,
  calendarConnected,
  calendarLoading,
  isAuthenticated,
  onConnectCalendar,
}: CompanionPanelProps) {
  const { language, t } = useLanguage()
  const [alarmHour, setAlarmHour] = useState(9)
  const [alarmMinute, setAlarmMinute] = useState(0)

  const phaseLabel = getPomodoroPhaseLabel(language, pomodoro.phase)
  const progress =
    pomodoro.phase === 'focus'
      ? 1 - pomodoro.remainingSeconds / (25 * 60)
      : pomodoro.phase === 'short_break'
        ? 1 - pomodoro.remainingSeconds / (5 * 60)
        : pomodoro.phase === 'long_break'
          ? 1 - pomodoro.remainingSeconds / (15 * 60)
          : 0

  return (
    <div className="mb-6 space-y-4 border-t border-foreground/10 pt-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.companion.title}</p>

      <div className="space-y-2 rounded-lg border border-foreground/10 bg-secondary/20 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">{t.companion.pomodoro}</span>
          <span className="text-[10px] text-accent">{phaseLabel}</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-secondary/50">
          <div
            className="h-full rounded-full bg-accent transition-all duration-1000"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
        <p className="text-center font-mono text-lg text-foreground">{formatCountdown(pomodoro.remainingSeconds)}</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={pomodoro.isRunning ? onPausePomodoro : onStartPomodoro}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-foreground/10 bg-secondary/40 px-2 py-1.5 text-[10px] text-foreground hover:bg-secondary/60"
          >
            {pomodoro.isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {pomodoro.isRunning ? t.companion.pause : t.companion.start}
          </button>
          <button
            type="button"
            onClick={onSkipPomodoro}
            className="flex items-center justify-center rounded-lg border border-foreground/10 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            title={t.companion.skip}
          >
            <SkipForward className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onResetPomodoro}
            className="flex items-center justify-center rounded-lg border border-foreground/10 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            title={t.companion.reset}
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlarmClock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{t.companion.alarms}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={formatAlarmTime(alarmHour, alarmMinute)}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number)
              if (Number.isFinite(h)) setAlarmHour(h)
              if (Number.isFinite(m)) setAlarmMinute(m)
            }}
            className="flex-1 rounded-lg border border-foreground/10 bg-secondary/30 px-2 py-1 text-xs text-foreground"
          />
          <button
            type="button"
            onClick={() => onAddAlarm(alarmHour, alarmMinute, 'once')}
            className="rounded-lg border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] text-accent hover:bg-accent/20"
          >
            {t.companion.addAlarm}
          </button>
        </div>
        {alarms.length === 0 ? (
          <p className="text-[10px] italic text-muted-foreground/60">{t.companion.noAlarms}</p>
        ) : (
          <div className="space-y-1">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center justify-between rounded-lg border border-foreground/10 bg-secondary/20 px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => onToggleAlarm(alarm.id)}
                  className={`text-xs ${alarm.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                >
                  {formatAlarmTime(alarm.hour, alarm.minute)}
                </button>
                <button type="button" onClick={() => onRemoveAlarm(alarm.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{t.companion.calendar}</span>
        </div>
        {!isAuthenticated ? (
          <p className="text-[10px] text-muted-foreground">{t.companion.loginRequired}</p>
        ) : (
          <>
            <button
              type="button"
              onClick={onConnectCalendar}
              disabled={calendarLoading}
              className="w-full rounded-lg border border-foreground/10 bg-secondary/30 px-2 py-1.5 text-[10px] text-foreground hover:bg-secondary/50 disabled:opacity-50"
            >
              {calendarConnected ? t.companion.calendarReconnect : t.companion.connectCalendar}
            </button>
            {calendarConnected ? (
              calendarEvents.length === 0 ? (
                <p className="text-[10px] italic text-muted-foreground/60">{t.companion.noEventsToday}</p>
              ) : (
                <ul className="space-y-1">
                  {calendarEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border border-foreground/10 bg-secondary/20 px-2 py-1.5 text-[10px]"
                    >
                      <span className="text-accent">{formatEventTime(event.start)}</span>
                      <span className="ml-2 text-foreground">{event.title}</span>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
