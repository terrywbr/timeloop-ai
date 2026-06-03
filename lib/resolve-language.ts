import type { Language } from '@/lib/translations'
import { DJ_SUPPORTED_LANGUAGES } from '@/lib/dj-i18n'

export const LANGUAGE_STORAGE_KEY = 'timeloop-language'
export const FALLBACK_LANGUAGE: Language = 'en'

export function isSupportedLanguage(value: string): value is Language {
  return DJ_SUPPORTED_LANGUAGES.includes(value as Language)
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/_/g, '-')
}

function matchChineseVariant(normalized: string): Language | null {
  const [, region, ...rest] = normalized.split('-')
  const script = rest.find((part) => part === 'hans' || part === 'hant')

  if (region === 'tw' || region === 'hk' || region === 'mo' || script === 'hant') {
    return 'zh-TW'
  }
  if (region === 'cn' || region === 'sg' || region === 'my' || script === 'hans') {
    return 'zh-CN'
  }
  if (normalized === 'zh') {
    return 'zh-CN'
  }
  return null
}

/** Map a single BCP-47 tag to a supported Language, or null if unsupported. */
export function matchBrowserLanguageTag(tag: string): Language | null {
  const normalized = normalizeTag(tag)
  if (!normalized) return null

  for (const lang of DJ_SUPPORTED_LANGUAGES) {
    if (normalized === lang.toLowerCase()) return lang
  }

  const [primary] = normalized.split('-')

  if (primary === 'en') return 'en'

  if (primary === 'zh') {
    return matchChineseVariant(normalized)
  }

  const primaryMap: Record<string, Language> = {
    ja: 'ja',
    ko: 'ko',
    es: 'es',
    fr: 'fr',
    de: 'de',
  }

  return primaryMap[primary] ?? null
}

/**
 * Resolve browser locale(s) to one of the 8 supported languages.
 * Checks `navigator.languages` in preference order, then `navigator.language`.
 * Falls back to `en` (en-US) when no match is found.
 */
export function resolveLanguageFromBrowser(
  browserLanguage: string,
  browserLanguages: readonly string[] = [],
): Language {
  const candidates = [...browserLanguages, browserLanguage].filter(Boolean)
  const seen = new Set<string>()

  for (const tag of candidates) {
    const normalized = normalizeTag(tag)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)

    const match = matchBrowserLanguageTag(tag)
    if (match) return match
  }

  return FALLBACK_LANGUAGE
}

/** Read saved preference, or detect from browser on first visit and persist it. */
export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return FALLBACK_LANGUAGE

  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (saved && isSupportedLanguage(saved)) {
    return saved
  }

  const detected = resolveLanguageFromBrowser(navigator.language, navigator.languages)
  localStorage.setItem(LANGUAGE_STORAGE_KEY, detected)
  return detected
}
