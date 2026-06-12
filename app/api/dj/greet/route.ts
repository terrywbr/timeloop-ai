import { NextResponse } from 'next/server'
import { getDjPersona, pickRandomPresetLine } from '@/lib/ai-dj-personas'
import { resolveTtsWithCache } from '@/lib/dj-tts-cache'
import { isMusicMoodId, type MusicMoodId } from '@/lib/music-moods'
import type { DjSessionType } from '@/lib/dj-types'
import { isOpenAiTtsConfigured } from '@/lib/openai-tts'
import type { Language } from '@/lib/translations'

export const runtime = 'nodejs'

type GreetRequestBody = {
  moodId?: string
  locale?: string
  sessionType?: DjSessionType
}

type GreetSuccess = {
  success: true
  text: string
  moodId: MusicMoodId
  personaId: string
  source: 'preset'
  audioUrl?: string
  cacheHit?: boolean
}

type GreetError = { success: false; error: string }

const LOCALES: Language[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'es', 'fr', 'de', 'th', 'vi']

function isLocale(value: string): value is Language {
  return LOCALES.includes(value as Language)
}

function jsonOk(body: GreetSuccess) {
  return NextResponse.json(body)
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message } satisfies GreetError, { status })
}

export async function POST(req: Request) {
  let body: GreetRequestBody
  try {
    body = (await req.json()) as GreetRequestBody
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  const moodId = body.moodId ?? ''
  if (!isMusicMoodId(moodId)) {
    return jsonError('Invalid moodId', 400)
  }

  const locale: Language = body.locale && isLocale(body.locale) ? body.locale : 'en'
  const persona = getDjPersona(moodId)
  const text = pickRandomPresetLine(moodId, locale)

  const response: GreetSuccess = {
    success: true,
    text,
    moodId,
    personaId: persona.id,
    source: 'preset',
  }

  if (isOpenAiTtsConfigured()) {
    try {
      const cached = await resolveTtsWithCache(text, persona.tts)
      response.audioUrl = cached.audioUrl
      response.cacheHit = cached.cacheHit
    } catch (error) {
      console.warn('[api/dj/greet] TTS cache path failed:', error)
    }
  }

  return jsonOk(response)
}
