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
    <div className="fixed inset-0 z-[190] flex h-[100dvh] w-screen flex-col bg-zinc-950 px-4 py-6 sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <Music2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">{t.music.onboarding.title}</h1>
            <p className="text-sm text-muted-foreground">{t.music.onboarding.subtitle}</p>
          </div>
        </div>

        <div className="no-scrollbar grid flex-1 grid-cols-1 gap-3 overflow-y-auto pb-4 sm:grid-cols-2">
          {MUSIC_MOODS.map((mood) => {
            const isSelected = selected.has(mood.id)
            const copy = t.music.moods[mood.id]

            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => toggleMood(mood.id)}
                className={`glass rounded-xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-accent/60 bg-accent/10 shadow-[0_0_24px_rgba(80,180,255,0.2)]'
                    : 'border-foreground/10 bg-popover/40 hover:border-foreground/20 hover:bg-popover/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-foreground/30 bg-transparent'
                    }`}
                  >
                    {isSelected ? <span className="text-xs">✓</span> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{copy.title}</p>
                    <p className="mt-0.5 text-xs text-accent/90">{copy.subtitle}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{copy.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={selected.size === 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.music.onboarding.next}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
