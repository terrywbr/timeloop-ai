import type { Language } from '@/lib/translations'

/** Map UI locale → locale used for AI DJ TTS + spoken line generation. */
export function djSpeechLocaleForUiLocale(uiLocale: Language): Language {
  return uiLocale
}

/** Map app UI locale to Web Speech API BCP-47 tag. */
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
    case 'th':
      return 'th-TH'
    case 'vi':
      return 'vi-VN'
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
  th: 'Respond in Thai (ไทย) only. Use Thai script — never romanization or English.',
  vi: 'Respond in Vietnamese (Tiếng Việt) only. Use Vietnamese diacritics — never English.',
}

/** LLM / fallback instruction locale. */
export function djResponseInstructionForUiLocale(uiLocale: Language): string {
  return LOCALE_RESPONSE_INSTRUCTION[djSpeechLocaleForUiLocale(uiLocale)]
}
