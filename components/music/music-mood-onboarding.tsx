'use client'

import { useState } from 'react'
import { ChevronRight, Music2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { MUSIC_MOODS, type MusicMoodId } from '@/lib/music-moods'

type MusicMoodOnboardingProps = {
  onComplete: (moods: MusicMoodId[]) => void
}

export default function MusicMoodOnboarding({ onComplete }: MusicMoodOnboardingProps) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<Set<MusicMoodId>>(new Set(['deep-night']))

  const toggleMood = (id: MusicMoodId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleNext = () => {
    onComplete([...selected])
  }

  return (
    <div
      className="fixed inset-0 z-[190] flex h-[100dvh] max-h-[100dvh] w-screen flex-col overflow-hidden bg-zinc-950"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col">
        <header className="mb-2 shrink-0 max-md:landscape:mb-1.5">
          <div className="flex items-start gap-2.5 max-md:landscape:gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 max-md:landscape:h-8 max-md:landscape:w-8">
              <Music2 className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold leading-tight text-foreground max-md:landscape:text-sm">
                {t.music.onboarding.title}
              </h1>
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground max-md:landscape:text-[11px]">
                {t.music.onboarding.subtitle}
              </p>
            </div>
          </div>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
          <div className="grid grid-cols-2 gap-2 max-md:landscape:gap-1.5 md:gap-3">
            {MUSIC_MOODS.map((mood) => {
              const isSelected = selected.has(mood.id)
              const copy = t.music.moods[mood.id]

              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => toggleMood(mood.id)}
                  className={`glass rounded-lg border p-2.5 text-left transition-all duration-200 max-md:landscape:p-2 md:rounded-xl md:p-3 ${
                    isSelected
                      ? 'border-accent/60 bg-accent/10 shadow-[0_0_20px_rgba(80,180,255,0.18)]'
                      : 'border-foreground/10 bg-popover/40 hover:border-foreground/20 hover:bg-popover/60'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border max-md:landscape:h-3.5 max-md:landscape:w-3.5 ${
                        isSelected
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-foreground/30 bg-transparent'
                      }`}
                    >
                      {isSelected ? <span className="text-[10px] leading-none">✓</span> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground max-md:landscape:text-[11px] md:text-sm">
                        {copy.title}
                      </p>
                      <p className="truncate text-[10px] text-accent/90 max-md:landscape:text-[9px] md:text-xs">
                        {copy.subtitle}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground max-md:landscape:line-clamp-1 max-md:landscape:text-[9px] md:text-xs">
                        {copy.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <footer className="shrink-0 border-t border-foreground/10 pt-2">
          <button
            type="button"
            onClick={handleNext}
            disabled={selected.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 max-md:landscape:py-2.5 max-md:landscape:text-xs"
          >
            {t.music.onboarding.next}
            <ChevronRight className="h-4 w-4 max-md:landscape:h-3.5 max-md:landscape:w-3.5" />
          </button>
        </footer>
      </div>
    </div>
  )
}
