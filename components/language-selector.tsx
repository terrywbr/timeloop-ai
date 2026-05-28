'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { languages, type Language } from '@/lib/translations'

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLanguage = languages.find((l) => l.code === language)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md p-1.5 text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
        title={t.language}
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs">{currentLanguage?.nativeName}</span>
      </button>

      {isOpen && (
        <div className="glass absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-foreground/10 bg-popover/90 p-1 shadow-xl">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as Language)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/10 ${
                language === lang.code ? 'bg-foreground/10 text-foreground' : 'text-foreground/70'
              }`}
            >
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
