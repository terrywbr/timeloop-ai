'use client'

import Image from 'next/image'
import type { StreamerOverlaySettings } from '@/lib/streamer-settings'

const FOUNDING_CREATOR_BADGE_SRC = '/badges/founding-creator.png'

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

function CreatorBadgeImage({ alt }: { alt: string }) {
  return (
    <div
      className="pointer-events-none absolute right-4 top-4 z-30 sm:right-5 sm:top-5"
      aria-label={alt}
    >
      <Image
        src={FOUNDING_CREATOR_BADGE_SRC}
        alt={alt}
        width={112}
        height={140}
        priority
        className="h-auto w-[5.5rem] drop-shadow-[0_6px_28px_rgba(251,191,36,0.45)] sm:w-[6.5rem]"
        sizes="(max-width: 640px) 88px, 104px"
      />
    </div>
  )
}

function StreamerPassBadge() {
  return <CreatorBadgeImage alt="Streamer Pass" />
}

function FoundingCreatorBadge() {
  return <CreatorBadgeImage alt="Founding Creator" />
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
