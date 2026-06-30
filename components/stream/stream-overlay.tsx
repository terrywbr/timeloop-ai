'use client'

import type { StreamerOverlaySettings } from '@/lib/streamer-settings'

type StreamOverlayProps = {
  settings: StreamerOverlaySettings
  isFoundingCreator?: boolean
  /** Paid Streamer Pass — shows badge when not a Founding Creator. */
  isStreamer?: boolean
}

const positionClasses: Record<StreamerOverlaySettings['position'], string> = {
  tl: 'top-6 left-6 items-start text-left',
  tr: 'top-6 right-6 items-end text-right',
  bl: 'bottom-6 left-6 items-start text-left',
  br: 'bottom-6 right-6 items-end text-right',
}

function StreamerPassBadge() {
  return (
    <div
      className="pointer-events-none absolute right-5 top-5 z-30 flex items-center gap-2 rounded-full border border-teal-200/30 bg-gradient-to-r from-teal-500/20 via-cyan-400/10 to-teal-500/15 px-3 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.45)] backdrop-blur-md"
      aria-hidden
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-400/25 text-[10px] font-bold text-teal-50 ring-1 ring-teal-200/35">
        ◉
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-50/95">
        Streamer Pass
      </span>
    </div>
  )
}

function FoundingCreatorBadge() {
  return (
    <div
      className="pointer-events-none absolute right-5 top-5 z-30 flex items-center gap-2 rounded-full border border-amber-200/35 bg-gradient-to-r from-amber-500/20 via-amber-300/10 to-amber-500/15 px-3 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.45)] backdrop-blur-md"
      aria-hidden
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/25 text-[10px] font-bold text-amber-100 ring-1 ring-amber-200/40"
      >
        ★
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-50/95">
        Founding Creator
      </span>
    </div>
  )
}

export default function StreamOverlay({
  settings,
  isFoundingCreator = false,
  isStreamer = false,
}: StreamOverlayProps) {
  const showOverlayText =
    settings.enabled && Boolean(settings.line1.trim() || settings.line2.trim())
  const showBadge = isFoundingCreator || isStreamer

  if (!showOverlayText && !showBadge) return null

  return (
    <>
      {isFoundingCreator ? (
        <FoundingCreatorBadge />
      ) : isStreamer ? (
        <StreamerPassBadge />
      ) : null}

      {showOverlayText ? (
        <div
          className={`pointer-events-none absolute z-20 flex max-w-[min(90vw,28rem)] flex-col gap-1 ${positionClasses[settings.position]}`}
          style={{ opacity: settings.opacity }}
          aria-hidden
        >
          {settings.line1.trim() ? (
            <p
              className="text-balance text-lg font-semibold leading-snug tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-xl"
              style={{
                fontFamily:
                  'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
              }}
            >
              {settings.line1}
            </p>
          ) : null}
          {settings.line2.trim() ? (
            <p
              className="text-balance text-sm font-medium leading-snug text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-base"
              style={{
                fontFamily:
                  'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
              }}
            >
              {settings.line2}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
