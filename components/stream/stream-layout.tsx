'use client'

import AmbientBackground from '@/components/timeloop/ambient-background'
import LiveNetworkWidget from '@/components/stream/live-network-widget'
import StreamOverlay from '@/components/stream/stream-overlay'
import StreamAudioPlayer from '@/components/stream-audio-player'
import { useLiveNetworkPresence } from '@/hooks/use-live-network-presence'
import type { AmbientWorldLayer } from '@/lib/timeloop/types'
import type { StreamerOverlaySettings } from '@/lib/streamer-settings'

type StreamLayoutProps = {
  ambientLayers: AmbientWorldLayer[]
  overlaySettings: StreamerOverlaySettings
  isFoundingCreator?: boolean
  isStreamer?: boolean
  showLiveNetwork?: boolean
  accessToken?: string | null
  authUserId?: string | null
  musicStreamUrl: string | null
  isMusicPlaying: boolean
  musicVolume: number
  isAudioUnlocked: boolean
  onPlaybackError: (url: string) => void
}

export default function StreamLayout({
  ambientLayers,
  overlaySettings,
  isFoundingCreator = false,
  isStreamer = false,
  showLiveNetwork = true,
  accessToken = null,
  authUserId = null,
  musicStreamUrl,
  isMusicPlaying,
  musicVolume,
  isAudioUnlocked,
  onPlaybackError,
}: StreamLayoutProps) {
  const roomName =
    overlaySettings.line1.trim() ||
    overlaySettings.line2.trim() ||
    'Live Room'
  const roomSubtitle =
    overlaySettings.line2.trim() ||
    overlaySettings.line1.trim() ||
    'Live on Time Loop AI'

  useLiveNetworkPresence({
    enabled: true,
    isStreamer,
    accessToken,
    authUserId,
    roomName,
    roomSubtitle,
  })

  return (
    <main className="timeloop-app-shell relative h-screen w-screen overflow-hidden bg-zinc-950">
      <AmbientBackground layers={ambientLayers} />
      <LiveNetworkWidget visible={showLiveNetwork} />
      <StreamOverlay
        settings={overlaySettings}
        isFoundingCreator={isFoundingCreator}
        isStreamer={isStreamer}
      />

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
