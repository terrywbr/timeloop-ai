'use client'

import { Menu, ImageIcon } from 'lucide-react'
import type { SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import type { GalleryWorld } from '@/lib/community/types'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import type { UserAccountProfile } from '@/lib/api-client'
import type { VideoBackgroundRef } from '@/components/ui/video-background'
import type { RadioStation } from '@/lib/radio-station'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import MobileControlContent from '@/components/mobile/mobile-control-content'
import MobileGalleryContent from '@/components/mobile/mobile-gallery-content'
import type { useCompanion } from '@/hooks/use-companion'
import type { useGoogleCalendar } from '@/hooks/use-google-calendar'
import type { VisualEffectSceneKey } from '@/lib/timeloop/world-resolver'
import type { StreamerBackgroundItem } from '@/components/stream/streamer-backgrounds-panel'

type TimeloopMobileDrawersProps = {
  videoRef: React.RefObject<VideoBackgroundRef | null>
  leftDrawerOpen: boolean
  onLeftDrawerOpenChange: (open: boolean) => void
  rightDrawerOpen: boolean
  onRightDrawerOpenChange: (open: boolean) => void
  onGenerate: (prompt: string, scene: string) => void
  isAuthenticated: boolean
  onRequireAuth: () => void | Promise<boolean>
  isGenerating: boolean
  currentStation: RadioStation | null
  isStationLoading: boolean
  isCurrentFavorited: boolean
  favoriteStations: RadioStation[]
  onNextStation: () => void
  onPrevStation: () => void
  onToggleFavorite: () => void
  onPlayFavorite: (station: RadioStation) => void
  onRemoveFavorite: (stationuuid: string) => void
  onReopenMusicOnboarding: () => void
  djVoiceEnabled: boolean
  onDjVoiceEnabledChange: (enabled: boolean) => void
  djIntervalEnabled: boolean
  onDjIntervalEnabledChange: (enabled: boolean) => void
  companion: ReturnType<typeof useCompanion>
  calendar: ReturnType<typeof useGoogleCalendar>
  isMusicPlaying: boolean
  onMusicPlayingChange: (playing: boolean) => void
  musicVolume: number
  onMusicVolumeChange: (volume: number) => void
  userProfile: UserAccountProfile | null
  savedWorlds: PublicGeneratedWorld[]
  activeWorldId: string | null
  onLoadWorld: (world: PublicGeneratedWorld) => void
  onDeleteWorld: (worldId: string) => void
  onRenameWorld: (worldId: string, title: string) => void
  onPublishWorld: (worldId: string, isPublic: boolean) => void | Promise<void>
  onCheckout: (kind: 'subscription' | 'credits') => void
  onDownload: () => void
  preferCreditPack: boolean
  isCnHost?: boolean
  cnWechatSupportId?: string
  selectedVisualEffect: VisualEffectSceneKey
  onVisualEffectChange: (scene: VisualEffectSceneKey) => void
  accessToken: string | null
  onEnterOfficialScene: (item: GallerySceneItem) => void
  onEnterWorld: (world: GalleryWorld) => void
  coFocusEnabled: boolean
  onCoFocusEnabledChange: (enabled: boolean) => void
  presenceCount: number
  streamerBackgrounds?: StreamerBackgroundItem[]
  isStreamerBackgroundUploading?: boolean
  streamerRotationMinutes?: 5 | 10
  onUploadStreamerBackground?: (file: File) => void | Promise<void>
  onDeleteStreamerBackground?: (id: string) => void | Promise<void>
  onStreamerRotationChange?: (minutes: 5 | 10) => void | Promise<void>
}

export default function TimeloopMobileDrawers({
  videoRef,
  leftDrawerOpen,
  onLeftDrawerOpenChange,
  rightDrawerOpen,
  onRightDrawerOpenChange,
  onGenerate,
  isAuthenticated,
  onRequireAuth,
  isGenerating,
  currentStation,
  isStationLoading,
  isCurrentFavorited,
  favoriteStations,
  onNextStation,
  onPrevStation,
  onToggleFavorite,
  onPlayFavorite,
  onRemoveFavorite,
  onReopenMusicOnboarding,
  djVoiceEnabled,
  onDjVoiceEnabledChange,
  djIntervalEnabled,
  onDjIntervalEnabledChange,
  companion,
  calendar,
  isMusicPlaying,
  onMusicPlayingChange,
  musicVolume,
  onMusicVolumeChange,
  userProfile,
  savedWorlds,
  activeWorldId,
  onLoadWorld,
  onDeleteWorld,
  onRenameWorld,
  onPublishWorld,
  onCheckout,
  onDownload,
  preferCreditPack,
  isCnHost = false,
  cnWechatSupportId = '',
  selectedVisualEffect,
  onVisualEffectChange,
  accessToken,
  onEnterOfficialScene,
  onEnterWorld,
  coFocusEnabled,
  onCoFocusEnabledChange,
  presenceCount,
  streamerBackgrounds = [],
  isStreamerBackgroundUploading = false,
  streamerRotationMinutes = 5,
  onUploadStreamerBackground,
  onDeleteStreamerBackground,
  onStreamerRotationChange,
}: TimeloopMobileDrawersProps) {
  return (
    <>
      <div className="pointer-events-auto fixed left-4 top-4 z-[80] max-md:portrait:pointer-events-none max-md:portrait:opacity-0 md:hidden max-md:landscape:left-3 max-md:landscape:top-3">
        <Drawer open={leftDrawerOpen} onOpenChange={onLeftDrawerOpenChange} direction="left">
          <DrawerTrigger asChild>
            <button
              type="button"
              className="glass flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-foreground/10 bg-popover/50 text-foreground/70 transition-all hover:bg-popover/70 hover:text-foreground max-md:landscape:h-9 max-md:landscape:w-9"
            >
              <Menu className="h-5 w-5" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="glass h-full w-[85%] max-w-[320px] bg-popover/90 max-md:landscape:w-[min(42vw,280px)] max-md:landscape:max-w-none">
            {leftDrawerOpen ? (
              <>
                <DrawerHeader className="sr-only">
                  <DrawerTitle>Control Panel</DrawerTitle>
                </DrawerHeader>
                <MobileControlContent
                  videoRef={videoRef}
                  onGenerate={onGenerate}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={onRequireAuth}
                  isGenerating={isGenerating}
                  onClose={() => onLeftDrawerOpenChange(false)}
                  currentStation={currentStation}
                  isStationLoading={isStationLoading}
                  isCurrentFavorited={isCurrentFavorited}
                  favoriteStations={favoriteStations}
                  onNextStation={onNextStation}
                  onPrevStation={onPrevStation}
                  onToggleFavorite={onToggleFavorite}
                  onPlayFavorite={onPlayFavorite}
                  onRemoveFavorite={onRemoveFavorite}
                  onReopenMusicOnboarding={onReopenMusicOnboarding}
                  djVoiceEnabled={djVoiceEnabled}
                  onDjVoiceEnabledChange={onDjVoiceEnabledChange}
                  djIntervalEnabled={djIntervalEnabled}
                  onDjIntervalEnabledChange={onDjIntervalEnabledChange}
                  companion={companion}
                  calendar={calendar}
                  isMusicPlaying={isMusicPlaying}
                  onMusicPlayingChange={onMusicPlayingChange}
                  musicVolume={musicVolume}
                  onMusicVolumeChange={onMusicVolumeChange}
                  userProfile={userProfile}
                  savedWorlds={savedWorlds}
                  activeWorldId={activeWorldId}
                  onLoadWorld={onLoadWorld}
                  onDeleteWorld={onDeleteWorld}
                  onRenameWorld={onRenameWorld}
                  onPublishWorld={onPublishWorld}
                  onCheckout={onCheckout}
                  onDownload={onDownload}
                  preferCreditPack={preferCreditPack}
                  isCnHost={isCnHost}
                  cnWechatSupportId={cnWechatSupportId}
                  selectedVisualEffect={selectedVisualEffect}
                  onVisualEffectChange={onVisualEffectChange}
                  streamerBackgrounds={streamerBackgrounds}
                  isStreamerBackgroundUploading={isStreamerBackgroundUploading}
                  streamerRotationMinutes={streamerRotationMinutes}
                  onUploadStreamerBackground={onUploadStreamerBackground}
                  onDeleteStreamerBackground={onDeleteStreamerBackground}
                  onStreamerRotationChange={onStreamerRotationChange}
                />
              </>
            ) : null}
          </DrawerContent>
        </Drawer>
      </div>

      <div className="pointer-events-auto fixed right-4 top-4 z-[80] max-md:portrait:pointer-events-none max-md:portrait:opacity-0 md:hidden max-md:landscape:right-3 max-md:landscape:top-3">
        <Drawer open={rightDrawerOpen} onOpenChange={onRightDrawerOpenChange} direction="right">
          <DrawerTrigger asChild>
            <button
              type="button"
              className="glass flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-foreground/10 bg-popover/50 text-foreground/70 transition-all hover:bg-popover/70 hover:text-foreground max-md:landscape:h-9 max-md:landscape:w-9"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="glass h-full w-[85%] max-w-[320px] bg-popover/90 max-md:landscape:w-[min(42vw,280px)] max-md:landscape:max-w-none">
            {rightDrawerOpen ? (
              <>
                <DrawerHeader className="sr-only">
                  <DrawerTitle>Community Gallery</DrawerTitle>
                </DrawerHeader>
                <MobileGalleryContent
                  onClose={() => onRightDrawerOpenChange(false)}
                  accessToken={accessToken}
                  onRequireAuth={onRequireAuth}
                  onEnterOfficialScene={onEnterOfficialScene}
                  onEnterWorld={onEnterWorld}
                  coFocusEnabled={coFocusEnabled}
                  onCoFocusEnabledChange={onCoFocusEnabledChange}
                  presenceCount={presenceCount}
                />
              </>
            ) : null}
          </DrawerContent>
        </Drawer>
      </div>
    </>
  )
}
