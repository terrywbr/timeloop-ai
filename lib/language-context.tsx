'use client'

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { type Language, translations } from './translations'
import { MUSIC_I18N } from './music-i18n'
import { DJ_I18N } from './dj-i18n'
import { COMPANION_I18N } from './companion-i18n'

type MergedTranslations = typeof translations['en'] & {
  music: typeof translations['en']['music'] & (typeof MUSIC_I18N)['en']
  dj: (typeof DJ_I18N)['en']
  companion: (typeof COMPANION_I18N)['en']
}

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: MergedTranslations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    // Try to detect browser language
    const browserLang = navigator.language
    if (browserLang.startsWith('zh')) {
      if (browserLang.includes('TW') || browserLang.includes('HK')) {
        setLanguage('zh-TW')
      } else {
        setLanguage('zh-CN')
      }
    } else if (browserLang.startsWith('ja')) {
      setLanguage('ja')
    } else if (browserLang.startsWith('ko')) {
      setLanguage('ko')
    } else if (browserLang.startsWith('es')) {
      setLanguage('es')
    } else if (browserLang.startsWith('fr')) {
      setLanguage('fr')
    } else if (browserLang.startsWith('de')) {
      setLanguage('de')
    }
    
    // Check localStorage for saved preference
    const saved = localStorage.getItem('timeloop-language') as Language
    if (saved && translations[saved]) {
      setLanguage(saved)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('timeloop-language', lang)
  }

  const t = useMemo(
    (): MergedTranslations => ({
      ...translations[language],
      music: {
        ...translations[language].music,
        ...MUSIC_I18N[language],
      },
      dj: DJ_I18N[language],
      companion: COMPANION_I18N[language],
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
