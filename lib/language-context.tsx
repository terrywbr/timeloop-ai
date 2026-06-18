'use client'

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { type Language, translations } from './translations'
import { MUSIC_I18N } from './music-i18n'
import { DJ_I18N } from './dj-i18n'
import {
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getInitialLanguage,
  isSupportedLanguage,
} from './resolve-language'

type MergedTranslations = typeof translations['en'] & {
  music: typeof translations['en']['music'] & (typeof MUSIC_I18N)['en']
  dj: (typeof DJ_I18N)['en']
}

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: MergedTranslations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    typeof window !== 'undefined' ? getInitialLanguage() : FALLBACK_LANGUAGE,
  )

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }

  const t = useMemo(
    (): MergedTranslations => ({
      ...translations[language],
      music: {
        ...translations[language].music,
        ...MUSIC_I18N[language],
      },
      dj: DJ_I18N[language],
    }),
    [language],
  )

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export { isSupportedLanguage, resolveLanguageFromBrowser } from './resolve-language'
