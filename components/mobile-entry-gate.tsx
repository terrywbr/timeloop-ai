'use client'

import { Smartphone } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

type MobileEntryGateProps = {
  onTap: () => void
}

export default function MobileEntryGate({ onTap }: MobileEntryGateProps) {
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={onTap}
      className="mobile-entry-gate fixed inset-0 z-[200] flex h-[100dvh] w-screen touch-manipulation flex-col items-center justify-center border-0 bg-zinc-950 px-6 py-8 text-center outline-none"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
      aria-label={t.immersive.mobileTapAndRotate}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      <div className="relative flex max-w-md flex-col items-center px-2">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-accent/30 bg-popover/40 shadow-[0_0_40px_rgba(80,180,255,0.25)]">
          <Smartphone className="h-12 w-12 animate-[spin_3s_ease-in-out_infinite] text-accent" />
        </div>
        <p className="text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
          {t.immersive.mobileTapAndRotate}
        </p>
      </div>
    </button>
  )
}
