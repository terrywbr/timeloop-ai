import type { DjTtsProfile } from '@/lib/ai-dj-personas'
import { playDjAudioFromBase64, stopDjSpeech } from '@/lib/dj-audio-player'

/** Client-side playback for OpenAI TTS audio returned from `/api/dj/speak`. */
export type CloudTtsProvider = {
  speakFromBase64: (audioBase64: string) => Promise<void>
  stop: () => void
  isSupported: () => boolean
}

export function createCloudTtsProvider(): CloudTtsProvider {
  return {
    speakFromBase64: (audioBase64) => playDjAudioFromBase64(audioBase64),
    stop: stopDjSpeech,
    isSupported: () => typeof window !== 'undefined' && typeof Audio !== 'undefined',
  }
}

export type { DjTtsProfile }
