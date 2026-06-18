import { getDjPersona } from '@/lib/ai-dj-personas'
import { deepSeekChatCompletion, isDeepSeekConfigured } from '@/lib/deepseek-chat'
import { getTaipeiTimeContext } from '@/lib/dj-taipei-time'
import { djResponseInstructionForUiLocale } from '@/lib/dj-speech-locale'
import { pickRandomPresetLine } from '@/lib/dj-preset-lines'
import { truncateTextForEdgeTts } from '@/lib/dj-tts-text'
import type { MusicMoodId } from '@/lib/music-moods'
import { MUSIC_I18N } from '@/lib/music-i18n'
import type { DjSessionType } from '@/lib/dj-types'
import type { Language } from '@/lib/translations'

function getMoodCopy(locale: Language, moodId: MusicMoodId) {
  const i18n = MUSIC_I18N[locale] ?? MUSIC_I18N['en']!
  return i18n.moods[moodId]
}

export type DjLineSource = 'llm' | 'preset'

export type GeneratedDjLine = {
  text: string
  source: DjLineSource
}

const SESSION_HINTS: Record<DjSessionType, { zh: string; en: string }> = {
  enter: {
    zh: '這是艦長第一次進入此音樂情境，請熱情歡迎並引導進入專注狀態。',
    en: 'Captain is entering this music mood for the first time — welcome them warmly into focus.',
  },
  return: {
    zh: '艦長今日再次回到艙內，請像老朋友一樣迎接，帶一點「你回來了」的溫度。',
    en: 'Captain returned today — greet them like an old friend who came back.',
  },
  interval: {
    zh: '定時陪伴播報：輕聲提醒艦長仍在正確的頻道上，鼓勵繼續但不施壓。',
    en: 'Interval companion check-in: gently remind the captain they are still on the right frequency.',
  },
  cofocus: {
    zh: '共專注陪伴播報：提及此刻不孤單，有同伴在同一頻率上。',
    en: 'Co-focus companion — mention they are not alone on this frequency.',
  },
}

function isChineseLocale(locale: Language) {
  return locale === 'zh-TW' || locale === 'zh-CN'
}

function speechRuleLocale(locale: Language): 'zh' | 'en' | 'th' | 'vi' {
  if (isChineseLocale(locale)) return 'zh'
  if (locale === 'th') return 'th'
  if (locale === 'vi') return 'vi'
  return 'en'
}

function buildLengthRule(locale: Language) {
  if (isChineseLocale(locale)) {
    return 'Length: 100–150 Chinese characters (字). Not shorter than 90, not longer than 170.'
  }
  if (locale === 'th') {
    return 'Length: 100–180 Thai characters. Not shorter than 80, not longer than 200. One speakable radio breath.'
  }
  if (locale === 'vi') {
    return 'Length: 100–180 Vietnamese characters. Not shorter than 80, not longer than 200. One speakable radio breath.'
  }
  return 'Length: about 55–85 English words — rich but speakable in one radio breath.'
}

function buildCreativeRules(locale: Language) {
  const ruleLocale = speechRuleLocale(locale)
  return [
    'Creative mandate:',
    ruleLocale === 'zh'
      ? '賽博朋克感性氛圍、電台 DJ 口語、放鬆引導、偶爾穿插詩意隱喻或隨機電台金句（如「頻率鎖定」「雜訊退場」「信號清晰」）。'
      : ruleLocale === 'th'
        ? 'โทนวิทยุยามค่ำแบบไซเบอร์พังก์ อบอุ่น ผ่อนคลาย มีภาพในหัว และสอดแทรกวลีดีเจไทยอย่างเป็นธรรมชาติ ห้ามใช้ภาษาอังกฤษปน'
        : ruleLocale === 'vi'
          ? 'Giọng radio đêm mang cảm xúc cyberpunk, thư giãn, giàu hình ảnh, có vài câu dẫn DJ tự nhiên bằng tiếng Việt. Không chèn tiếng Anh.'
      : 'Cyberpunk-sentimental radio tone, relaxing guidance, occasional poetic metaphors or DJ catchphrases (frequency locked, noise fading, signal clear).',
    ruleLocale === 'zh'
      ? '內容必須飽滿、有畫面感，禁止空洞套話或只有一句招呼。'
      : ruleLocale === 'th'
        ? 'เนื้อหาต้องเต็ม มีบรรยากาศชัดเจน ไม่ใช่คำทักทายสั้น ๆ หรือประโยคกลวง ๆ'
        : ruleLocale === 'vi'
          ? 'Nội dung phải đầy đặn, có không khí rõ ràng, không được chỉ là một câu chào rỗng.'
      : 'Content must feel vivid and full — no hollow one-liners.',
    ruleLocale === 'zh'
      ? '自然融入「當前台北時間」報時（日期、星期、幾點幾分、清晨/午後/夜晚/深夜），像深夜廣播主播順口帶出。'
      : ruleLocale === 'th'
        ? 'สอดแทรกเวลาไทเปปัจจุบัน วันที่ วันในสัปดาห์ ชั่วโมง นาที และช่วงเวลา อย่างลื่นไหลเหมือนผู้จัดรายการวิทยุพูดสด'
        : ruleLocale === 'vi'
          ? 'Lồng ghép giờ Đài Bắc hiện tại, ngày tháng, thứ, giờ phút và buổi trong ngày thật tự nhiên như người dẫn radio đêm.'
      : 'Naturally weave in the current Taipei time (date, weekday, hour:minute, time-of-day) like a late-night broadcaster.',
    'Vary openings each time — never repeat the same first sentence pattern.',
    'End with a soft focus invitation (one short clause).',
  ].join('\n')
}

function buildUserPrompt(params: {
  moodId: MusicMoodId
  locale: Language
  sessionType: DjSessionType
  stationName?: string
}) {
  const { moodId, locale, sessionType, stationName } = params
  const moodCopy = getMoodCopy(locale, moodId)
  const ruleLocale = speechRuleLocale(locale)
  const time = getTaipeiTimeContext(new Date(), ruleLocale)
  const sessionHint = SESSION_HINTS[sessionType][isChineseLocale(locale) ? 'zh' : 'en']

  return [
    `Music mood: ${moodCopy.title} — ${moodCopy.subtitle}`,
    `Scene vibe: ${moodCopy.description}`,
    stationName ? `Current station: ${stationName}` : null,
    `Session: ${sessionType}`,
    sessionHint,
    `Live Taipei clock: ${time.fullLabel}`,
    'Write one fresh DJ monologue for spoken radio delivery.',
  ]
    .filter(Boolean)
    .join('\n')
}

function normalizeDjLine(text: string) {
  return truncateTextForEdgeTts(text.trim(), 220)
}

export async function generateDjLine(params: {
  moodId: MusicMoodId
  locale: Language
  sessionType: DjSessionType
  stationName?: string
}): Promise<GeneratedDjLine> {
  const { moodId, locale, sessionType } = params
  const presetFallback = pickRandomPresetLine(moodId, locale)

  if (!isDeepSeekConfigured()) {
    return { text: presetFallback, source: 'preset' }
  }

  const persona = getDjPersona(moodId)
  const responseLocale = djResponseInstructionForUiLocale(locale)

  try {
    const text = await deepSeekChatCompletion(
      [
        {
          role: 'system',
          content: [
            persona.systemPrompt,
            buildLengthRule(locale),
            buildCreativeRules(locale),
            responseLocale,
            'Output only the spoken script. No markdown, labels, or quotes wrapping the whole line.',
          ].join('\n\n'),
        },
        {
          role: 'user',
          content: buildUserPrompt(params),
        },
      ],
      { temperature: 0.95, maxTokens: 360, timeoutMs: 12_000 },
    )

    if (text.length < 20) {
      return { text: presetFallback, source: 'preset' }
    }
    return { text: normalizeDjLine(text), source: 'llm' }
  } catch (error) {
    console.warn('[dj-llm] DeepSeek generation failed, using preset:', error)
    return { text: presetFallback, source: 'preset' }
  }
}
