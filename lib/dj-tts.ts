import type { DjSpeechProfile } from '@/lib/ai-dj-personas'

type SpeakOptions = {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

let activeUtterance: SpeechSynthesisUtterance | null = null

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

function pickVoice(profile: DjSpeechProfile): SpeechSynthesisVoice | undefined {
  const synth = getSpeechSynthesis()
  if (!synth) return undefined

  const voices = synth.getVoices()
  if (voices.length === 0) return undefined

  const langPrefix = profile.lang.split('-')[0]?.toLowerCase()
  const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(profile.lang.toLowerCase()))
  if (langMatch) return langMatch

  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix))
  return prefixMatch ?? voices[0]
}

export function isDjTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopDjSpeech() {
  const synth = getSpeechSynthesis()
  if (!synth) return
  synth.cancel()
  activeUtterance = null
}

export function isDjSpeaking(): boolean {
  const synth = getSpeechSynthesis()
  return synth?.speaking ?? false
}

export function speakDjText(text: string, profile: DjSpeechProfile, options?: SpeakOptions): Promise<void> {
  return new Promise((resolve) => {
    const synth = getSpeechSynthesis()
    if (!synth || !text.trim()) {
      options?.onEnd?.()
      resolve()
      return
    }

    stopDjSpeech()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = profile.lang
    utterance.rate = profile.rate
    utterance.pitch = profile.pitch
    utterance.volume = 1

    const voice = pickVoice(profile)
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      activeUtterance = utterance
      options?.onStart?.()
    }

    utterance.onend = () => {
      activeUtterance = null
      options?.onEnd?.()
      resolve()
    }

    utterance.onerror = () => {
      activeUtterance = null
      options?.onError?.(new Error('Speech synthesis failed'))
      options?.onEnd?.()
      resolve()
    }

    synth.speak(utterance)
  })
}

/** Warm up voice list (Safari needs async load). */
export function primeDjVoices() {
  const synth = getSpeechSynthesis()
  if (!synth) return
  synth.getVoices()
}
