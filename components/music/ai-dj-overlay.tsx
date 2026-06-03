'use client'

import { Mic, MicOff, Radio } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import type { AiDjState } from '@/hooks/use-ai-dj'

type AiDjOverlayProps = {
  aiDj: AiDjState
  onDismiss?: () => void
}

export default function AiDjOverlay({ aiDj, onDismiss }: AiDjOverlayProps) {
  const { t } = useLanguage()

  if (!aiDj.visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex justify-center px-4 max-md:landscape:bottom-4">
      <div
        className="pointer-events-auto w-full max-w-xl animate-fade-in-up glass rounded-xl border border-accent/35 bg-popover/85 px-4 py-3 shadow-[0_0_28px_rgba(80,180,255,0.2)] backdrop-blur-md max-md:landscape:max-w-lg max-md:landscape:px-3 max-md:landscape:py-2"
        onClick={onDismiss}
        onKeyDown={(e) => e.key === 'Escape' && onDismiss?.()}
        role="status"
        aria-live="polite"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/20">
              <Radio className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{t.dj.label}</p>
              <p className="truncate text-[10px] text-accent/90">{aiDj.personaName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
            {aiDj.connecting ? (
              <span>{t.dj.connecting}</span>
            ) : aiDj.speaking ? (
              <>
                <Mic className="h-3 w-3 animate-pulse text-accent" />
                <span>{t.dj.voiceOn}</span>
              </>
            ) : aiDj.voiceEnabled ? (
              <>
                <MicOff className="h-3 w-3 opacity-50" />
                <span>{t.dj.subtitlesOnly}</span>
              </>
            ) : (
              <>
                <MicOff className="h-3 w-3" />
                <span>{t.dj.voiceOff}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground/95 max-md:landscape:text-xs">
          {aiDj.connecting ? t.dj.connecting : aiDj.text}
        </p>
      </div>
    </div>
  )
}
