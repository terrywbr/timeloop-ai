'use client'

import { useLanguage } from '@/lib/language-context'

export default function GeneratingOverlay() {
  const { t } = useLanguage()

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-background/50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm font-medium text-foreground/90">{t.generating}</p>
      </div>
    </div>
  )
}
