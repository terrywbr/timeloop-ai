'use client'

import type { ReactNode } from 'react'
import AmbientBackground from '@/components/timeloop/ambient-background'
import StreamOverlay from '@/components/stream/stream-overlay'
import StreamAudioPlayer from '@/components/stream-audio-player'
import type { AmbientWorldLayer } from '@/lib/timeloop/types'
import type { StreamerOverlaySettings } from '@/lib/streamer-settings'

type StreamLayoutProps = {
  ambientLayers: AmbientWorldLayer[]
  overlaySettings: StreamerOverlaySettings
  musicStreamUrl: string | null
  ambienceStreamUrl: string | null
  isMusicPlaying: boolean
  musicVolume: number
  ambienceVolume: number
  isAudioUnlocked: boolean
  onPlaybackError: (url: string) => void
  previewGate?: ReactNode
}

export default function StreamLayout({
  ambientLayers,
  overlaySettings,
  musicStreamUrl,
  ambienceStreamUrl,
  isMusicPlaying,
  musicVolume,
  ambienceVolume,
  isAudioUnlocked,
  onPlaybackError,
  previewGate,
}: StreamLayoutProps) {
  return (
    <main className="timeloop-app-shell relative h-screen w-screen overflow-hidden bg-zinc-950">
      <AmbientBackground layers={ambientLayers} />
      <StreamOverlay settings={overlaySettings} />
      {previewGate}

      {musicStreamUrl ? (
        <StreamAudioPlayer
          streamUrl={musicStreamUrl}
          playing={isMusicPlaying}
          volume={musicVolume}
          muted={!isAudioUnlocked}
          streamMode
          onPlaybackError={onPlaybackError}
        />
      ) : null}

      {ambienceStreamUrl ? (
        <StreamAudioPlayer
          streamUrl={ambienceStreamUrl}
          playing={isMusicPlaying}
          volume={ambienceVolume}
          muted={!isAudioUnlocked}
          loop
          streamMode
        />
      ) : null}
    </main>
  )
}
