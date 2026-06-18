import { NextResponse } from 'next/server'
import { getDjPersona } from '@/lib/ai-dj-personas'
import { isMusicMoodId, type MusicMoodId } from '@/lib/music-moods'
import type { Language } from '@/lib/translations'
import { djSpeechLocaleForUiLocale } from '@/lib/dj-speech-locale'
import { synthesizeEdgeSpeech } from '@/lib/edge-tts'
import { resolveEdgeVoice } from '@/lib/dj-edge-voices'
import { isEdgeTtsCacheable, resolveTtsWithEdgeCache } from '@/lib/dj-edge-tts-cache'
import { MAX_EDGE_TTS_CHARS, truncateTextForEdgeTts } from '@/lib/dj-tts-text'

export const runtime = 'nodejs'

const LOCALES: Language[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'es', 'fr', 'de', 'th', 'vi']

function isLocale(value: string): value is Language {
  return LOCALES.includes(value as Language)
}

type SpeakRequestBody = {
  text?: string
  moodId?: string
  locale?: string
  format?: 'binary' | 'base64' | 'url'
}

type SpeakSuccessUrl = {
  success: true
  moodId: MusicMoodId
  personaId: string
  voice: string
  mimeType: 'audio/mpeg'
  audioUrl?: string
  audioBase64?: string
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

const MAX_SPEAK_CHARS = MAX_EDGE_TTS_CHARS

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

  const rawText = body.text?.trim() ?? ''
  if (!rawText) {
    return jsonError('Missing text', 400)
  }
  const text = truncateTextForEdgeTts(rawText, MAX_SPEAK_CHARS)
  if (!text) {
    return jsonError('Missing text', 400)
  }

  const uiLocale: Language = body.locale && isLocale(body.locale) ? body.locale : 'en'
  const speechLocale = djSpeechLocaleForUiLocale(uiLocale)
  const format = body.format ?? 'url'
  const persona = getDjPersona(moodId)
  const edgeVoice = resolveEdgeVoice(moodId, speechLocale)

  try {
    // Try Edge TTS with cache first.
    if (isEdgeTtsCacheable()) {
      const cached = await resolveTtsWithEdgeCache(text, moodId, speechLocale).catch(() => null)
      if (cached) {
        if (format === 'url') {
          return NextResponse.json({
            success: true,
            moodId,
            personaId: persona.id,
            voice: edgeVoice.voice,
            mimeType: 'audio/mpeg',
            audioUrl: cached.audioUrl,
            cacheHit: cached.cacheHit,
          } satisfies SpeakSuccessUrl)
        }
        // Need the raw bytes for binary/base64 formats.
        const audioResponse = await fetch(cached.audioUrl, { cache: 'no-store' })
        if (!audioResponse.ok) throw new Error('Failed to read cached Edge TTS audio')
        const audioBuffer = await audioResponse.arrayBuffer()
        if (format === 'binary') {
          return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'X-DJ-Voice': edgeVoice.voice,
            },
          })
        }
        return NextResponse.json({
          success: true,
          moodId,
          personaId: persona.id,
          voice: edgeVoice.voice,
          mimeType: 'audio/mpeg',
          audioBase64: arrayBufferToBase64(audioBuffer),
          cacheHit: cached.cacheHit,
        } satisfies SpeakSuccessBase64)
      }
    }

    // Synthesize fresh Edge TTS audio.
    const audioBuffer = await synthesizeEdgeSpeech(text, edgeVoice)

    if (format === 'url') {
      // Without a cache we can only return base64 inline.
      return NextResponse.json({
        success: true,
        moodId,
        personaId: persona.id,
        voice: edgeVoice.voice,
        mimeType: 'audio/mpeg',
        audioBase64: arrayBufferToBase64(audioBuffer),
        cacheHit: false,
      } satisfies SpeakSuccessUrl)
    }

    if (format === 'binary') {
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-store',
          'X-DJ-Voice': edgeVoice.voice,
        },
      })
    }

    return NextResponse.json({
      success: true,
      moodId,
      personaId: persona.id,
      voice: edgeVoice.voice,
      mimeType: 'audio/mpeg',
      audioBase64: arrayBufferToBase64(audioBuffer),
      cacheHit: false,
    } satisfies SpeakSuccessBase64)
  } catch (error) {
    // Fallback: try OpenAI TTS if Edge fails.
    console.warn('[api/dj/speak] Edge TTS failed, trying OpenAI fallback:', error)
    try {
      const { isOpenAiTtsConfigured, synthesizeOpenAiSpeech } = await import('@/lib/openai-tts')
      if (!isOpenAiTtsConfigured()) {
        throw new Error('OpenAI TTS is also not configured')
      }
      const audioBuffer = await synthesizeOpenAiSpeech(text, persona.tts)
      if (format === 'binary') {
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
        })
      }
      return NextResponse.json({
        success: true,
        moodId,
        personaId: persona.id,
        voice: persona.tts.voice,
        mimeType: 'audio/mpeg',
        audioBase64: arrayBufferToBase64(audioBuffer),
        cacheHit: false,
      } satisfies SpeakSuccessBase64)
    } catch (fallbackError) {
      console.error('[api/dj/speak]', fallbackError)
      const message = fallbackError instanceof Error ? fallbackError.message : 'TTS synthesis failed'
      return jsonError(message, 502)
    }
  }
}
