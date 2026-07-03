'use client'

import AmbientBackground from '@/components/timeloop/ambient-background'
import LiveNetworkWidget from '@/components/stream/live-network-widget'
import StreamOverlay from '@/components/stream/stream-overlay'
import StreamAudioPlayer from '@/components/stream-audio-player'
import StreamFullscreenPrompt from '@/components/stream/stream-fullscreen-prompt'
import { useLiveNetworkPresence } from '@/hooks/use-live-network-presence'
import { useStreamFullscreen } from '@/hooks/use-stream-fullscreen'
import type { AmbientWorldLayer } from '@/lib/timeloop/types'

type StreamLayoutProps = {
  ambientLayers: AmbientWorldLayer[]
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
  useLiveNetworkPresence({
    enabled: true,
    isStreamer,
    accessToken,
    authUserId,
    roomName: 'Live Room',
    roomSubtitle: 'Live on Time Loop AI',
  })

  const { showTapPrompt, enterFullscreen } = useStreamFullscreen(true)

  return (
    <main className="timeloop-app-shell relative h-[100dvh] min-h-[100dvh] w-screen overflow-hidden bg-zinc-950">
      <AmbientBackground layers={ambientLayers} />
      <LiveNetworkWidget visible={showLiveNetwork} />
      <StreamOverlay isFoundingCreator={isFoundingCreator} isStreamer={isStreamer} />

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

      <StreamFullscreenPrompt visible={showTapPrompt} onEnter={() => void enterFullscreen()} />
    </main>
  )
}
