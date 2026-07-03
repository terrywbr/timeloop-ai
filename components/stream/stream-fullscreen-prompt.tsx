'use client'

import { Maximize2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

type StreamFullscreenPromptProps = {
  visible: boolean
  onEnter: () => void
}

export default function StreamFullscreenPrompt({ visible, onEnter }: StreamFullscreenPromptProps) {
  const { t } = useLanguage()

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={onEnter}
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[100] flex max-w-[min(92vw,22rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2.5 text-sm font-medium text-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition hover:border-accent/40 hover:bg-black/80"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
    >
      <Maximize2 className="h-4 w-4 shrink-0 text-accent" />
      <span>{t.streamerOverlay.streamFullscreenTap}</span>
    </button>
  )
}
