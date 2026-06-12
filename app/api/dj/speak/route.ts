import { NextResponse } from 'next/server'
import { getDjPersona } from '@/lib/ai-dj-personas'
import { resolveTtsWithCache } from '@/lib/dj-tts-cache'
import { isMusicMoodId, type MusicMoodId } from '@/lib/music-moods'
import { isOpenAiTtsConfigured } from '@/lib/openai-tts'

export const runtime = 'nodejs'

type SpeakRequestBody = {
  text?: string
  moodId?: string
  format?: 'binary' | 'base64' | 'url'
}

type SpeakSuccessUrl = {
  success: true
  moodId: MusicMoodId
  personaId: string
  voice: string
  mimeType: 'audio/mpeg'
  audioUrl: string
  cacheHit: boolean
}

type SpeakSuccessBase64 = {
  success: true
  moodId: MusicMoodId
  personaId: string
  voice: string
  mimeType: 'audio/mpeg'
  audioBase64: string
  cacheHit: boolean
}

type SpeakError = { success: false; error: string }

const MAX_SPEAK_CHARS = 2000

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message } satisfies SpeakError, { status })
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export async function POST(req: Request) {
  if (!isOpenAiTtsConfigured()) {
    return jsonError('AI voice is not configured (missing OPENAI_API_KEY)', 503)
  }

  let body: SpeakRequestBody
  try {
    body = (await req.json()) as SpeakRequestBody
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  const moodId = body.moodId ?? ''
  if (!isMusicMoodId(moodId)) {
    return jsonError('Invalid moodId', 400)
  }

  const text = body.text?.trim() ?? ''
  if (!text) {
    return jsonError('Missing text', 400)
  }
  if (text.length > MAX_SPEAK_CHARS) {
    return jsonError(`Text exceeds ${MAX_SPEAK_CHARS} characters`, 400)
  }

  const format = body.format ?? 'url'
  const persona = getDjPersona(moodId)

  try {
    const resolved = await resolveTtsWithCache(text, persona.tts)

    if (format === 'url') {
      return NextResponse.json({
        success: true,
        moodId,
        personaId: persona.id,
        voice: persona.tts.voice,
        mimeType: 'audio/mpeg',
        audioUrl: resolved.audioUrl,
        cacheHit: resolved.cacheHit,
      } satisfies SpeakSuccessUrl)
    }

    const audioResponse = await fetch(resolved.audioUrl, { cache: 'no-store' })
    if (!audioResponse.ok) {
      throw new Error(`Failed to read cached audio (${audioResponse.status})`)
    }
    const audioBuffer = await audioResponse.arrayBuffer()

    if (format === 'binary') {
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': resolved.cacheHit ? 'public, max-age=31536000, immutable' : 'no-store',
          'X-DJ-Persona-Id': persona.id,
          'X-DJ-Voice': persona.tts.voice,
          'X-DJ-Cache-Hit': resolved.cacheHit ? '1' : '0',
        },
      })
    }

    return NextResponse.json({
      success: true,
      moodId,
      personaId: persona.id,
      voice: persona.tts.voice,
      mimeType: 'audio/mpeg',
      audioBase64: arrayBufferToBase64(audioBuffer),
      cacheHit: resolved.cacheHit,
    } satisfies SpeakSuccessBase64)
  } catch (error) {
    console.error('[api/dj/speak]', error)
    const message = error instanceof Error ? error.message : 'TTS synthesis failed'
    return jsonError(message, 502)
  }
}
