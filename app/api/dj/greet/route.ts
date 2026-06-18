import { NextResponse } from 'next/server'
import { getDjPersona } from '@/lib/ai-dj-personas'
import { isMusicMoodId, type MusicMoodId } from '@/lib/music-moods'
import type { DjSessionType } from '@/lib/dj-types'
import type { Language } from '@/lib/translations'
import { djSpeechLocaleForUiLocale } from '@/lib/dj-speech-locale'
import { generateDjLine } from '@/lib/dj-llm'

export const runtime = 'nodejs'

type GreetRequestBody = {
  moodId?: string
  locale?: string
  sessionType?: DjSessionType
  stationName?: string
}

type GreetSuccess = {
  success: true
  text: string
  moodId: MusicMoodId
  personaId: string
  source: 'llm' | 'preset'
}

type GreetError = { success: false; error: string }

const LOCALES: Language[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'es', 'fr', 'de', 'th', 'vi']

function isLocale(value: string): value is Language {
  return LOCALES.includes(value as Language)
}

export async function POST(req: Request) {
  let body: GreetRequestBody
  try {
    body = (await req.json()) as GreetRequestBody
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' } satisfies GreetError, {
      status: 400,
    })
  }

  const moodId = body.moodId ?? ''
  if (!isMusicMoodId(moodId)) {
    return NextResponse.json({ success: false, error: 'Invalid moodId' } satisfies GreetError, {
      status: 400,
    })
  }

  const uiLocale: Language = body.locale && isLocale(body.locale) ? body.locale : 'en'
  const speechLocale = djSpeechLocaleForUiLocale(uiLocale)
  const sessionType: DjSessionType = body.sessionType ?? 'enter'
  const persona = getDjPersona(moodId)

  const { text, source } = await generateDjLine({
    moodId,
    locale: speechLocale,
    sessionType,
    stationName: body.stationName,
  })

  return NextResponse.json({
    success: true,
    text,
    moodId,
    personaId: persona.id,
    source,
  } satisfies GreetSuccess)
}
