'use client'

import type { StreamerOverlaySettings } from '@/lib/streamer-settings'

type StreamOverlayProps = {
  settings: StreamerOverlaySettings
}

const positionClasses: Record<StreamerOverlaySettings['position'], string> = {
  tl: 'top-6 left-6 items-start text-left',
  tr: 'top-6 right-6 items-end text-right',
  bl: 'bottom-6 left-6 items-start text-left',
  br: 'bottom-6 right-6 items-end text-right',
}

export default function StreamOverlay({ settings }: StreamOverlayProps) {
  if (!settings.enabled) return null
  if (!settings.line1.trim() && !settings.line2.trim()) return null

  return (
    <div
      className={`pointer-events-none absolute z-20 flex max-w-[min(90vw,28rem)] flex-col gap-1 ${positionClasses[settings.position]}`}
      style={{ opacity: settings.opacity }}
      aria-hidden
    >
      {settings.line1.trim() ? (
        <p
          className="text-balance text-lg font-semibold leading-snug tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-xl"
          style={{ fontFamily: 'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }}
        >
          {settings.line1}
        </p>
      ) : null}
      {settings.line2.trim() ? (
        <p
          className="text-balance text-sm font-medium leading-snug text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-base"
          style={{ fontFamily: 'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }}
        >
          {settings.line2}
        </p>
      ) : null}
    </div>
  )
}
