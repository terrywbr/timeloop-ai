import type { DjSpeechProfile } from '@/lib/ai-dj-personas'

/** Phase 3: swap Web Speech for OpenAI / ElevenLabs via this interface. */
export type CloudTtsProvider = {
  speak: (text: string, profile: DjSpeechProfile) => Promise<void>
  stop: () => void
  isSupported: () => boolean
}

export function createCloudTtsProvider(_provider: 'openai' | 'elevenlabs'): CloudTtsProvider | null {
  return null
}
