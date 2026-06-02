'use client'

import { computeDisplayFreq } from '@/lib/radio-station'
import type { RadioStation } from '@/lib/radio-station'

type NowPlayingTunerProps = {
  station: RadioStation | null
}

export default function NowPlayingTuner({ station }: NowPlayingTunerProps) {
  if (!station) return null

  const freq = computeDisplayFreq(station.stationuuid)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[90] flex justify-center px-4">
      <div className="animate-fade-in-up glass rounded-xl border border-accent/40 bg-popover/80 px-5 py-3 shadow-[0_0_32px_rgba(80,180,255,0.25)] backdrop-blur-md">
        <p className="text-center font-mono text-sm tracking-wide text-foreground sm:text-base">
          <span className="text-accent">Freq-{freq}</span>
          <span className="mx-2 text-muted-foreground">:</span>
          <span>{station.name}</span>
        </p>
      </div>
    </div>
  )
}
