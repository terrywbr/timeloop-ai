import type { Language } from '@/lib/translations'

/** Map app locale to Web Speech API BCP-47 tag. */
export function speechLangForLocale(locale: Language): string {
  switch (locale) {
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
}
