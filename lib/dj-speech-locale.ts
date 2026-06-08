import type { Language } from '@/lib/translations'

/**
 * Southeast Asia UI locales where AI DJ voice is hard-bound to premium English (EN).
 * UI and streamer overlay render 100% in th/vi; TTS + LLM speech lines use EN only.
 */
export const SEA_EN_DJ_VOICE_LOCALES: ReadonlySet<Language> = new Set(['th', 'vi'])

export function isSeaEnDjVoiceUiLocale(locale: Language): boolean {
  return SEA_EN_DJ_VOICE_LOCALES.has(locale)
}

/** Map UI locale → locale used for AI DJ TTS + spoken line generation. */
export function djSpeechLocaleForUiLocale(uiLocale: Language): Language {
  if (isSeaEnDjVoiceUiLocale(uiLocale)) return 'en'
  return uiLocale
}

/** Map app UI locale to Web Speech API BCP-47 tag (respects SEA EN-voice rule). */
export function speechLangForLocale(uiLocale: Language): string {
  switch (djSpeechLocaleForUiLocale(uiLocale)) {
    case 'zh-CN':
      return 'zh-CN'
    case 'zh-TW':
      return 'zh-TW'
    case 'ja':
      return 'ja-JP'
    case 'ko':
      return 'ko-KR'
    case 'es':
      return 'es-ES'
    case 'fr':
      return 'fr-FR'
    case 'de':
      return 'de-DE'
    default:
      return 'en-US'
  }
}

export const LOCALE_RESPONSE_INSTRUCTION: Record<Language, string> = {
  en: 'Respond in English only.',
  'zh-TW': 'Respond in Traditional Chinese (繁體中文) only.',
  'zh-CN': 'Respond in Simplified Chinese (简体中文) only.',
  ja: 'Respond in Japanese (日本語) only. Use kanji and kana — never romaji.',
  ko: 'Respond in Korean (한국어) only. Use Hangul — never romanization.',
  es: 'Respond in Spanish (Español) only.',
  fr: 'Respond in French (Français) only.',
  de: 'Respond in German (Deutsch) only.',
  th: 'Respond in English only.',
  vi: 'Respond in English only.',
}

/** LLM / fallback instruction locale (EN for th/vi UI). */
export function djResponseInstructionForUiLocale(uiLocale: Language): string {
  return LOCALE_RESPONSE_INSTRUCTION[djSpeechLocaleForUiLocale(uiLocale)]
}
