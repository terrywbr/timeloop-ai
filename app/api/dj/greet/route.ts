import { NextResponse } from 'next/server'
import { getDjPersona } from '@/lib/ai-dj-personas'
import { getDjFallback, DJ_I18N } from '@/lib/dj-i18n'
import {
  getAlarmDjFallback,
  getCalendarDjFallback,
  getIntervalDjFallback,
  getPomodoroDjFallback,
} from '@/lib/companion-i18n'
import { isMusicMoodId, type MusicMoodId } from '@/lib/music-moods'
import type { DjSessionType, DjSpeakContext } from '@/lib/dj-types'
import { togetherChatCompletion } from '@/lib/together-chat'
import type { Language } from '@/lib/translations'

export const runtime = 'nodejs'

type GreetRequestBody = {
  moodId?: string
  locale?: string
  localTime?: string
  stationName?: string
  sessionType?: DjSessionType
  context?: DjSpeakContext
}

type GreetSuccess = {
  success: true
  text: string
  moodId: MusicMoodId
  personaId: string
  source: 'llm' | 'fallback'
}

type GreetError = { success: false; error: string }

const LOCALES: Language[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'es', 'fr', 'de']

const SESSION_TYPES: DjSessionType[] = [
  'enter',
  'return',
  'interval',
  'pomodoro',
  'alarm',
  'calendar',
]

function isLocale(value: string): value is Language {
  return LOCALES.includes(value as Language)
}

function parseSessionType(value: string | undefined): DjSessionType {
  if (value && SESSION_TYPES.includes(value as DjSessionType)) {
    return value as DjSessionType
  }
  return 'enter'
}

function jsonOk(body: GreetSuccess) {
  return NextResponse.json(body)
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message } satisfies GreetError, { status })
}

function resolveFallback(
  locale: Language,
  moodId: MusicMoodId,
  sessionType: DjSessionType,
  localTime: string,
  context?: DjSpeakContext,
): string {
  const moodTitle = DJ_I18N[locale]?.personas[moodId]?.name ?? moodId

  if (sessionType === 'interval') {
    const idx = Math.floor(Date.now() / (30 * 60 * 1000))
    return getIntervalDjFallback(locale, moodId, localTime, idx)
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

  return getDjFallback(locale, moodId, {
    time: localTime,
    moodTitle,
    stationName: context?.eventTitle,
  })
}

function buildUserContext(
  sessionType: DjSessionType,
  moodId: MusicMoodId,
  localTime: string,
  stationName: string | undefined,
  locale: Language,
  context?: DjSpeakContext,
): string {
  const localeInstruction =
    locale.startsWith('zh') || locale === 'ja' || locale === 'ko'
      ? `Respond in ${locale} language.`
      : `Respond in ${locale}.`

  const lines: string[] = [`Mood: ${moodId}`, `Local time: ${localTime}`, localeInstruction]

  switch (sessionType) {
    case 'enter':
      lines.push('User just completed mood onboarding. Welcome them aboard.')
      break
    case 'return':
      lines.push('User is returning to the cockpit today.')
      break
    case 'interval':
      lines.push(
        'This is a 30-minute companion check-in. One or two short sentences only. Do not repeat the full welcome. Encourage focus or a brief stretch.',
      )
      break
    case 'pomodoro':
      lines.push(`Pomodoro phase: ${context?.phase ?? 'focus'}. Remaining minutes: ${context?.remainingMinutes ?? '?'}.`)
      break
    case 'alarm':
      lines.push(`Alarm fired: ${context?.alarmLabel ?? 'Alarm'}.`)
      break
    case 'calendar':
      lines.push(
        `Upcoming event "${context?.eventTitle ?? 'Meeting'}" in ${context?.minutesUntil ?? 5} minutes. Remind Captain gently.`,
      )
      break
  }

  if (stationName) lines.push(`Current station: ${stationName}`)
  return lines.filter(Boolean).join('\n')
}

function systemPromptForSession(personaPrompt: string, sessionType: DjSessionType): string {
  if (sessionType === 'interval') {
    return `${personaPrompt} Keep this reply to 1-2 short sentences. Companion check-in, not a full welcome.`
  }
  if (sessionType === 'pomodoro' || sessionType === 'alarm' || sessionType === 'calendar') {
    return `${personaPrompt} Keep this reply to 1-2 short sentences. Be supportive and concise.`
  }
  return personaPrompt
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
  const localTime = body.localTime?.trim() || new Date().toLocaleTimeString()
  const stationName = body.stationName?.trim()
  const sessionType = parseSessionType(body.sessionType)
  const context = body.context

  const persona = getDjPersona(moodId)
  const fallbackText = resolveFallback(locale, moodId, sessionType, localTime, context)

  const maxTokens = sessionType === 'enter' || sessionType === 'return' ? 200 : 100

  try {
    const text = await togetherChatCompletion(
      [
        { role: 'system', content: systemPromptForSession(persona.systemPrompt, sessionType) },
        {
          role: 'user',
          content: buildUserContext(sessionType, moodId, localTime, stationName, locale, context),
        },
      ],
      { temperature: 0.75, maxTokens, timeoutMs: 5000 },
    )

    return jsonOk({
      success: true,
      text,
      moodId,
      personaId: persona.id,
      source: 'llm',
    })
  } catch (error) {
    console.warn('[api/dj/greet] LLM fallback:', error)
    return jsonOk({
      success: true,
      text: fallbackText,
      moodId,
      personaId: persona.id,
      source: 'fallback',
    })
  }
}
