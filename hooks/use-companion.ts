'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AlarmConfig, CompanionEvent, PomodoroState } from '@/lib/companion/types'
import { DEFAULT_POMODORO_CONFIG } from '@/lib/companion/types'
import {
  createAlarm,
  markAlarmFired,
  shouldFireAlarm,
} from '@/lib/companion/alarm-engine'
import {
  createInitialPomodoroState,
  pausePomodoro,
  resetPomodoro,
  skipPomodoroPhase,
  startPomodoro,
  tickPomodoro,
} from '@/lib/companion/pomodoro-engine'
import { loadAlarms, loadPomodoroConfig, loadPomodoroState, saveAlarms, savePomodoroState } from '@/lib/companion/storage'

type UseCompanionOptions = {
  cockpitActive: boolean
  onCompanionEvent: (event: CompanionEvent) => void
  isDjBusy: () => boolean
}

export function useCompanion({ cockpitActive, onCompanionEvent, isDjBusy }: UseCompanionOptions) {
  const config = loadPomodoroConfig()
  const [pomodoro, setPomodoro] = useState<PomodoroState>(
    () => loadPomodoroState() ?? createInitialPomodoroState(config),
  )
  const [alarms, setAlarms] = useState<AlarmConfig[]>(() => loadAlarms())
  const pomodoroRef = useRef(pomodoro)
  const alarmsRef = useRef(alarms)
  pomodoroRef.current = pomodoro
  alarmsRef.current = alarms

  useEffect(() => {
    savePomodoroState(pomodoro)
  }, [pomodoro])

  useEffect(() => {
    saveAlarms(alarms)
  }, [alarms])

  useEffect(() => {
    if (!pomodoro.isRunning) return
    const id = window.setInterval(() => {
      const result = tickPomodoro(pomodoroRef.current, config)
      setPomodoro(result.state)
      if (result.phaseChanged && result.previousPhase !== 'idle') {
        onCompanionEvent({
          type: 'pomodoro',
          phase: result.state.phase,
          previousPhase: result.previousPhase,
        })
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [config, onCompanionEvent, pomodoro.isRunning])

  useEffect(() => {
    if (!cockpitActive) return

    const checkAlarms = () => {
      const now = new Date()
      const current = alarmsRef.current
      const fired: { prev: AlarmConfig; next: AlarmConfig }[] = []

      for (const alarm of current) {
        if (shouldFireAlarm(alarm, now)) {
          fired.push({ prev: alarm, next: markAlarmFired(alarm, now) })
        }
      }

      if (fired.length === 0) return

      setAlarms((prev) =>
        prev.map((alarm) => fired.find((f) => f.prev.id === alarm.id)?.next ?? alarm),
      )

      for (const { prev } of fired) {
        onCompanionEvent({ type: 'alarm', alarm: prev })
      }
    }

    checkAlarms()
    const id = window.setInterval(checkAlarms, 1000)
    return () => window.clearInterval(id)
  }, [cockpitActive, onCompanionEvent])

  const startPomodoroTimer = useCallback(() => {
    setPomodoro((prev) => {
      const next = startPomodoro(prev, config)
      if (prev.phase === 'idle') {
        onCompanionEvent({ type: 'pomodoro', phase: 'focus', previousPhase: 'idle' })
      }
      return next
    })
  }, [config, onCompanionEvent])

  const pausePomodoroTimer = useCallback(() => {
    setPomodoro((prev) => pausePomodoro(prev))
  }, [])

  const resetPomodoroTimer = useCallback(() => {
    setPomodoro(resetPomodoro(config))
  }, [config])

  const skipPomodoroTimer = useCallback(() => {
    setPomodoro((prev) => {
      const previousPhase = prev.phase
      const next = skipPomodoroPhase(prev, config)
      if (previousPhase !== 'idle') {
        onCompanionEvent({ type: 'pomodoro', phase: next.phase, previousPhase })
      }
      return next
    })
  }, [config, onCompanionEvent])

  const addAlarm = useCallback((hour: number, minute: number, repeat: AlarmConfig['repeat'] = 'once') => {
    setAlarms((prev) => [...prev, createAlarm({ hour, minute, repeat })])
  }, [])

  const removeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))
  }, [])

  return {
    pomodoro,
    alarms,
    pomodoroConfig: config,
    startPomodoroTimer,
    pausePomodoroTimer,
    resetPomodoroTimer,
    skipPomodoroTimer,
    addAlarm,
    removeAlarm,
    toggleAlarm,
  }
}
