'use client'

import AmbientBackground from '@/components/timeloop/ambient-background'
import StreamOverlay from '@/components/stream/stream-overlay'
import StreamAudioPlayer from '@/components/stream-audio-player'
import type { AmbientWorldLayer } from '@/lib/timeloop/types'
import type { StreamerOverlaySettings } from '@/lib/streamer-settings'

type StreamLayoutProps = {
  ambientLayers: AmbientWorldLayer[]
  overlaySettings: StreamerOverlaySettings
  musicStreamUrl: string | null
  isMusicPlaying: boolean
  musicVolume: number
  isAudioUnlocked: boolean
  onPlaybackError: (url: string) => void
}

export default function StreamLayout({
  ambientLayers,
  overlaySettings,
  musicStreamUrl,
  isMusicPlaying,
  musicVolume,
  isAudioUnlocked,
  onPlaybackError,
}: StreamLayoutProps) {
  return (
    <main className="timeloop-app-shell relative h-screen w-screen overflow-hidden bg-zinc-950">
      <AmbientBackground layers={ambientLayers} />
      <StreamOverlay settings={overlaySettings} />

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
    </main>
  )
}
