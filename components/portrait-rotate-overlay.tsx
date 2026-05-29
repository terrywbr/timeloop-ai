'use client'

import { Smartphone } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export default function PortraitRotateOverlay() {
  const { t } = useLanguage()

  return (
    <div
      className="fixed inset-0 z-[100] hidden max-md:portrait:flex max-md:portrait:items-center max-md:portrait:justify-center bg-[#04050a]/95 px-6 py-8 backdrop-blur-md max-md:portrait:px-8 max-md:portrait:py-10"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t.immersive.rotateToLandscape}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      <div className="relative w-full max-w-md text-center max-md:portrait:max-w-lg">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-accent/30 bg-popover/40 shadow-[0_0_40px_rgba(80,180,255,0.25)] max-md:portrait:mb-10 max-md:portrait:h-28 max-md:portrait:w-28">
          <Smartphone className="h-12 w-12 animate-[spin_3s_ease-in-out_infinite] text-accent max-md:portrait:h-14 max-md:portrait:w-14" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent/90 max-md:portrait:text-base max-md:portrait:tracking-[0.25em]">
          {t.immersive.rotateLabel}
        </p>
        <p className="mt-5 text-lg font-semibold leading-relaxed text-foreground max-md:portrait:mt-6 max-md:portrait:text-2xl max-md:portrait:leading-snug">
          {t.immersive.rotateToLandscape}
        </p>
        <div className="mt-8 inline-flex max-w-full items-center gap-2.5 rounded-full border border-foreground/10 bg-popover/30 px-5 py-3 text-sm text-muted-foreground max-md:portrait:mt-10 max-md:portrait:px-6 max-md:portrait:py-3.5 max-md:portrait:text-base">
          <span className="inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent" />
          <span className="text-left">{t.immersive.landscapeHint}</span>
        </div>
      </div>
    </div>
  )
}
