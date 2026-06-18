'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MusicMoodId } from '@/lib/music-moods'
import { pickRandomPresetLine } from '@/lib/ai-dj-personas'
import type { DjSessionType, DjSpeakParams } from '@/lib/dj-types'
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
import {
  isDjAudioSupported,
  playDjAudioFromBase64,
  playDjAudioFromUrl,
  playDjSpeechSynthesis,
  stopDjSpeech,
} from '@/lib/dj-audio-player'
import { djSpeechLocaleForUiLocale, speechLangForLocale } from '@/lib/dj-speech-locale'
import { truncateTextForEdgeTts } from '@/lib/dj-tts-text'

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
  | {
      success: true
      text: string
      moodId: MusicMoodId
      personaId: string
      source: 'llm' | 'preset'
    }
  | { success: false; error: string }

type SpeakApiResponse =
  | {
      success: true
      moodId: MusicMoodId
      personaId: string
      voice: string
      mimeType: 'audio/mpeg'
      audioUrl?: string
      audioBase64?: string
      cacheHit?: boolean
    }
  | { success: false; error: string }

type UseAiDjOptions = {
  locale: Language
  getPersonaName: (moodId: MusicMoodId) => string
  onDuckMusic?: (duck: boolean) => void
}

async function fetchDjSpeechAudio(
  text: string,
  moodId: MusicMoodId,
  locale: Language,
): Promise<{ audioUrl?: string; audioBase64?: string } | null> {
  const response = await fetch('/api/dj/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, moodId, locale, format: 'url' }),
  })

  const data = (await response.json()) as SpeakApiResponse
  if (!response.ok || !data.success) {
    console.warn('[use-ai-dj] TTS unavailable:', data.success ? 'unknown' : data.error)
    return null
  }

  return {
    audioUrl: data.audioUrl,
    audioBase64: data.audioBase64,
  }
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
      const { moodId, sessionType, force = false } = params

      if (speakInFlightRef.current) return false
      if (!force && sessionType === 'return' && !shouldGreetToday()) return false

      speakInFlightRef.current = true
      const personaName = getPersonaName(moodId)
      const voiceEnabled = loadDjVoiceEnabled()
      const speechLocale = djSpeechLocaleForUiLocale(locale)

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

      let text = pickRandomPresetLine(moodId, speechLocale)
      let audioUrl: string | null = null
      let audioBase64: string | null = null

      try {
        const response = await fetch('/api/dj/greet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moodId,
            locale: speechLocale,
            sessionType,
            stationName: params.stationName,
          }),
        })
        const data = (await response.json()) as GreetApiResponse
        if (response.ok && data.success) {
          text = data.text
        }
      } catch {
        // keep local preset fallback
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

      if (voiceEnabled && isDjAudioSupported()) {
        setState((prev) => ({ ...prev, speaking: true }))

        // Duck music only when audio actually starts playing, not while fetching TTS.
        // This prevents permanent duck if the fetch fails or audio never plays.
        let duckActive = false
        const playbackOptions = {
          onStart: () => {
            duckActive = true
            onDuckMusic?.(true)
          },
          onEnd: () => {
            if (duckActive) onDuckMusic?.(false)
            duckActive = false
            setState((prev) => ({ ...prev, speaking: false }))
            scheduleHide(4000)
          },
          onError: () => {
            if (duckActive) onDuckMusic?.(false)
            duckActive = false
            setState((prev) => ({ ...prev, speaking: false }))
            scheduleHide(hideDelay)
          },
        }

        try {
          const speakText = truncateTextForEdgeTts(text)
          if (!audioUrl) {
            let audio = await fetchDjSpeechAudio(speakText, moodId, speechLocale)
            if (!audio?.audioUrl && !audio?.audioBase64 && speakText !== text) {
              audio = await fetchDjSpeechAudio(truncateTextForEdgeTts(text, 280), moodId, speechLocale)
            }
            audioUrl = audio?.audioUrl ?? null
            audioBase64 = audio?.audioBase64 ?? null
          }

          if (audioUrl) {
            await playDjAudioFromUrl(audioUrl, playbackOptions)
          } else if (audioBase64) {
            await playDjAudioFromBase64(audioBase64, playbackOptions)
          } else {
            await playDjSpeechSynthesis(speakText, speechLangForLocale(locale), playbackOptions)
          }
        } catch {
          if (duckActive) onDuckMusic?.(false)
          setState((prev) => ({ ...prev, speaking: false }))
          scheduleHide(hideDelay)
        }
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
      return await speakLine({
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
