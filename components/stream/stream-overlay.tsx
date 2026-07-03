'use client'

import Image from 'next/image'

const FOUNDING_CREATOR_BADGE_SRC = '/badges/founding-creator.png'

type StreamOverlayProps = {
  isFoundingCreator?: boolean
  /** Paid Streamer Pass — shows badge when not a Founding Creator. */
  isStreamer?: boolean
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
  isFoundingCreator = false,
  isStreamer = false,
}: StreamOverlayProps) {
  if (!isFoundingCreator && !isStreamer) return null

  return isFoundingCreator ? <FoundingCreatorBadge /> : <StreamerPassBadge />
}
