'use client'

import { Volume2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { requestAppFullscreen } from '@/lib/fullscreen'

type AudioUnlockButtonProps = {
  onUnlock: () => void
}

export default function AudioUnlockButton({ onUnlock }: AudioUnlockButtonProps) {
  const { t } = useLanguage()

  const handleClick = () => {
    void requestAppFullscreen()
    onUnlock()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="glass pointer-events-auto fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-popover/75 px-5 py-2.5 text-sm font-medium text-foreground shadow-[0_0_24px_rgba(80,180,255,0.25)] backdrop-blur-md transition hover:border-accent/70 hover:bg-popover/90 max-md:landscape:bottom-3 max-md:landscape:scale-95"
      aria-label={t.immersive.enterCockpit}
    >
      <Volume2 className="h-4 w-4 text-accent" />
      {t.immersive.enterCockpit}
    </button>
  )
}
