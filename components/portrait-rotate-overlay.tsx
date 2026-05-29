'use client'

import { Smartphone } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

type PortraitRotateOverlayProps = {
  visible: boolean
}

export default function PortraitRotateOverlay({ visible }: PortraitRotateOverlayProps) {
  const { t } = useLanguage()

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#04050a]/95 px-6 backdrop-blur-md"
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

      <div className="relative max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-accent/30 bg-popover/40 shadow-[0_0_40px_rgba(80,180,255,0.25)]">
          <Smartphone className="h-10 w-10 animate-[spin_3s_ease-in-out_infinite] text-accent" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent/80">
          {t.immersive.rotateLabel}
        </p>
        <p className="mt-4 text-base font-medium leading-relaxed text-foreground/95">
          {t.immersive.rotateToLandscape}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-popover/30 px-4 py-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          {t.immersive.landscapeHint}
        </div>
      </div>
    </div>
  )
}
