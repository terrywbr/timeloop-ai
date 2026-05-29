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
      className="glass pointer-events-auto fixed bottom-5 left-1/2 z-[90] flex max-w-[min(92vw,24rem)] -translate-x-1/2 items-center justify-center gap-2.5 rounded-full border border-accent/40 bg-popover/85 px-6 py-3 text-sm font-medium text-foreground shadow-[0_0_24px_rgba(80,180,255,0.25)] backdrop-blur-md transition hover:border-accent/70 hover:bg-popover/90 max-md:portrait:bottom-[max(1.25rem,env(safe-area-inset-bottom))] max-md:portrait:z-[101] max-md:portrait:max-w-[min(94vw,22rem)] max-md:portrait:gap-3 max-md:portrait:px-8 max-md:portrait:py-4 max-md:portrait:text-lg max-md:portrait:font-semibold max-md:landscape:bottom-4 max-md:landscape:px-5 max-md:landscape:py-2.5 max-md:landscape:text-base"
      aria-label={t.immersive.enterCockpit}
    >
      <Volume2 className="h-4 w-4 shrink-0 text-accent max-md:portrait:h-5 max-md:portrait:w-5" />
      {t.immersive.enterCockpit}
    </button>
  )
}
