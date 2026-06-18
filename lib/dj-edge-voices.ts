import type { MusicMoodId } from '@/lib/music-moods'
import type { Language } from '@/lib/translations'
import { djSpeechLocaleForUiLocale } from '@/lib/dj-speech-locale'

export type EdgeVoiceProfile = {
  voice: string
  lang: string
  rate?: string
  pitch?: string
}

/** Locale-first Edge neural voices; mood tweaks rate/pitch for radio character. */
const LOCALE_EDGE_VOICES: Record<Language, EdgeVoiceProfile> = {
  en: { voice: 'en-US-JennyNeural', lang: 'en-US', rate: '-4%' },
  'zh-TW': { voice: 'zh-TW-HsiaoChenNeural', lang: 'zh-TW', rate: '-6%' },
  'zh-CN': { voice: 'zh-CN-XiaoxiaoNeural', lang: 'zh-CN', rate: '-6%' },
  ja: { voice: 'ja-JP-NanamiNeural', lang: 'ja-JP', rate: '-5%' },
  ko: { voice: 'ko-KR-SunHiNeural', lang: 'ko-KR', rate: '-5%' },
  es: { voice: 'es-ES-ElviraNeural', lang: 'es-ES', rate: '-4%' },
  fr: { voice: 'fr-FR-DeniseNeural', lang: 'fr-FR', rate: '-4%' },
  de: { voice: 'de-DE-KatjaNeural', lang: 'de-DE', rate: '-4%' },
  th: { voice: 'th-TH-PremwadeeNeural', lang: 'th-TH', rate: '-5%' },
  vi: { voice: 'vi-VN-HoaiMyNeural', lang: 'vi-VN', rate: '-5%' },
}

/** Mood overrides — e.g. rebel DJ uses 雲哲, commander uses 曉臻. */
const MOOD_VOICE_OVERRIDES: Partial<Record<MusicMoodId, Partial<Record<Language, Partial<EdgeVoiceProfile>>>>> = {
  'neon-tokyo': {
    'zh-TW': { voice: 'zh-TW-YunJheNeural', rate: '-8%', pitch: '-2Hz' },
    'zh-CN': { voice: 'zh-CN-YunxiNeural', rate: '-8%', pitch: '-2Hz' },
    en: { voice: 'en-US-GuyNeural', rate: '-8%', pitch: '-2Hz' },
  },
  'deep-night': {
    'zh-TW': { voice: 'zh-TW-HsiaoChenNeural', rate: '-10%', pitch: '-4Hz' },
    en: { voice: 'en-US-AriaNeural', rate: '-10%', pitch: '-4Hz' },
  },
  'deep-space': {
    'zh-TW': { voice: 'zh-TW-YunJheNeural', rate: '-14%', pitch: '-6Hz' },
    en: { voice: 'en-US-DavisNeural', rate: '-14%', pitch: '-6Hz' },
  },
  'galactic-tavern': {
    'zh-TW': { voice: 'zh-TW-HsiaoChenNeural', rate: '-6%', pitch: '+2Hz' },
    en: { voice: 'en-US-JennyNeural', rate: '-6%', pitch: '+2Hz' },
  },
  'galactic-classical': {
    'zh-TW': { voice: 'zh-TW-HsiaoChenNeural', rate: '-5%' },
    en: { voice: 'en-US-AriaNeural', rate: '-5%' },
  },
  'retro-earth': {
    'zh-TW': { voice: 'zh-TW-YunJheNeural', rate: '+2%', pitch: '+4Hz' },
    en: { voice: 'en-US-BrandonNeural', rate: '+2%', pitch: '+4Hz' },
  },
}

export function resolveEdgeVoice(moodId: MusicMoodId, uiLocale: Language): EdgeVoiceProfile {
  const speechLocale = djSpeechLocaleForUiLocale(uiLocale)
  const base = LOCALE_EDGE_VOICES[speechLocale]
  const override = MOOD_VOICE_OVERRIDES[moodId]?.[speechLocale]
  return { ...base, ...override }
}
