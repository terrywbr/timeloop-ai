'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MusicMoodId } from '@/lib/music-moods'
import { getDjPersona } from '@/lib/ai-dj-personas'
import {
  getAlarmDjFallback,
  getCalendarDjFallback,
  getIntervalDjFallback,
  getPomodoroDjFallback,
} from '@/lib/companion-i18n'
import { formatDjLocalTime, getDjFallback } from '@/lib/dj-i18n'
import type { DjSessionType, DjSpeakContext, DjSpeakParams } from '@/lib/dj-types'
import type { Language } from '@/lib/translations'
import {
  clearGreetDate,
  loadDjVoiceEnabled,
  loadIntervalEnabled,
  markGreetedToday,
  saveDjVoiceEnabled,
  saveIntervalEnabled,
  shouldGreetToday,
} from '@/lib/dj-settings'
import { isDjTtsSupported, primeDjVoices, speakDjText, stopDjSpeech } from '@/lib/dj-tts'

export type AiDjState = {
  visible: boolean
  connecting: boolean
  speaking: boolean
  text: string
  personaName: string
  moodId: MusicMoodId | null
  voiceEnabled: boolean
  intervalEnabled: boolean
}

type GreetApiResponse =
  | { success: true; text: string; moodId: MusicMoodId; personaId: string; source: 'llm' | 'fallback' }
  | { success: false; error: string }

type UseAiDjOptions = {
  locale: Language
  getPersonaName: (moodId: MusicMoodId) => string
  onDuckMusic?: (duck: boolean) => void
}

function resolveLocalFallback(
  locale: Language,
  moodId: MusicMoodId,
  sessionType: DjSessionType,
  localTime: string,
  context?: DjSpeakContext,
): string {
  if (sessionType === 'interval') {
    return getIntervalDjFallback(locale, moodId, localTime, Math.floor(Date.now() / 60000))
  }
  if (sessionType === 'pomodoro') {
    const phase = (context?.phase ?? 'focus') as 'focus' | 'short_break' | 'long_break' | 'idle'
    return getPomodoroDjFallback(locale, phase)
  }
  if (sessionType === 'alarm') {
    return getAlarmDjFallback(locale, context?.alarmLabel ?? 'Alarm')
  }
  if (sessionType === 'calendar') {
    return getCalendarDjFallback(locale, context?.eventTitle ?? 'Event', context?.minutesUntil ?? 5)
  }
  return getDjFallback(locale, moodId, { time: localTime, stationName: context?.eventTitle })
}

export function useAiDj({ locale, getPersonaName, onDuckMusic }: UseAiDjOptions) {
  const [state, setState] = useState<AiDjState>({
    visible: false,
    connecting: false,
    speaking: false,
    text: '',
    personaName: '',
    moodId: null,
    voiceEnabled: true,
    intervalEnabled: true,
  })

  const hideTimerRef = useRef<number | null>(null)
  const speakInFlightRef = useRef(false)

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      voiceEnabled: loadDjVoiceEnabled(),
      intervalEnabled: loadIntervalEnabled(),
    }))
    primeDjVoices()
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.addEventListener?.('voiceschanged', primeDjVoices)
    }
    return () => {
      stopDjSpeech()
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  const scheduleHide = useCallback((delayMs: number) => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      setState((prev) => ({ ...prev, visible: false, speaking: false }))
    }, delayMs)
  }, [])

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    saveDjVoiceEnabled(enabled)
    if (!enabled) stopDjSpeech()
    setState((prev) => ({ ...prev, voiceEnabled: enabled, speaking: false }))
  }, [])

  const setIntervalEnabled = useCallback((enabled: boolean) => {
    saveIntervalEnabled(enabled)
    setState((prev) => ({ ...prev, intervalEnabled: enabled }))
  }, [])

  const speakLine = useCallback(
    async (params: DjSpeakParams) => {
      const { moodId, sessionType, stationName, context, force = false } = params

      if (speakInFlightRef.current) return false
      if (!force && sessionType === 'return' && !shouldGreetToday()) return false

      speakInFlightRef.current = true
      const persona = getDjPersona(moodId)
      const personaName = getPersonaName(moodId)
      const localTime = formatDjLocalTime(locale)
      const voiceEnabled = loadDjVoiceEnabled()

      setState((prev) => ({
        ...prev,
        visible: true,
        connecting: true,
        speaking: false,
        text: '',
        personaName,
        moodId,
        voiceEnabled,
      }))

      let text = resolveLocalFallback(locale, moodId, sessionType, localTime, context)

      try {
        const response = await fetch('/api/dj/greet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moodId,
            locale,
            localTime,
            stationName,
            sessionType,
            context,
          }),
        })
        const data = (await response.json()) as GreetApiResponse
        if (response.ok && data.success) {
          text = data.text
        }
      } catch {
        // keep fallback
      }

      setState((prev) => ({
        ...prev,
        connecting: false,
        text,
      }))

      if (sessionType === 'enter' || sessionType === 'return') {
        markGreetedToday()
      }

      const hideDelay = sessionType === 'interval' ? 7000 : 9000
      const speechProfile = {
        ...persona.speechProfile,
        lang: locale.startsWith('zh') ? locale : locale === 'ja' ? 'ja-JP' : locale === 'ko' ? 'ko-KR' : 'en-US',
      }

      if (voiceEnabled && isDjTtsSupported()) {
        onDuckMusic?.(true)
        setState((prev) => ({ ...prev, speaking: true }))
        await speakDjText(text, speechProfile, {
          onEnd: () => {
            onDuckMusic?.(false)
            setState((prev) => ({ ...prev, speaking: false }))
            scheduleHide(4000)
          },
          onError: () => {
            onDuckMusic?.(false)
            setState((prev) => ({ ...prev, speaking: false }))
            scheduleHide(hideDelay)
          },
        })
      } else {
        scheduleHide(hideDelay)
      }

      speakInFlightRef.current = false
      return true
    },
    [getPersonaName, locale, onDuckMusic, scheduleHide],
  )

  const triggerGreeting = useCallback(
    async (params: {
      moodId: MusicMoodId
      stationName?: string
      sessionType?: 'enter' | 'return'
      force?: boolean
    }) => {
      await speakLine({
        moodId: params.moodId,
        sessionType: params.sessionType ?? 'enter',
        stationName: params.stationName,
        force: params.force,
      })
    },
    [speakLine],
  )

  const resetGreetSchedule = useCallback(() => {
    clearGreetDate()
  }, [])

  const dismiss = useCallback(() => {
    stopDjSpeech()
    onDuckMusic?.(false)
    setState((prev) => ({ ...prev, visible: false, speaking: false, connecting: false }))
  }, [onDuckMusic])

  const isBusy = useCallback(() => speakInFlightRef.current || state.speaking, [state.speaking])

  return {
    aiDj: state,
    speakLine,
    triggerGreeting,
    setVoiceEnabled,
    setIntervalEnabled,
    resetGreetSchedule,
    dismiss,
    isBusy,
  }
}
