import type { DjTtsProfile } from '@/lib/ai-dj-personas'

const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech'
const MAX_INPUT_CHARS = 4096

export function isOpenAiTtsConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

export function getOpenAiTtsModelOverride(): DjTtsProfile['model'] | undefined {
  const value = process.env.OPENAI_TTS_MODEL?.trim()
  if (value === 'tts-1' || value === 'tts-1-hd') return value
  return undefined
}

export async function synthesizeOpenAiSpeech(text: string, profile: DjTtsProfile): Promise<ArrayBuffer> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const input = text.trim().slice(0, MAX_INPUT_CHARS)
  if (!input) {
    throw new Error('TTS input is empty')
  }

  const model = getOpenAiTtsModelOverride() ?? profile.model

  const response = await fetch(OPENAI_SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input,
      voice: profile.voice,
      response_format: 'mp3',
      speed: profile.speed,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`OpenAI TTS failed (${response.status}): ${detail.slice(0, 200)}`)
  }

  return response.arrayBuffer()
}
