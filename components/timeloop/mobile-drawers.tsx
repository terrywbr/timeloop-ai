'use client'

import { Menu, ImageIcon } from 'lucide-react'
import type { SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import type { UserAccountProfile, CheckoutKind } from '@/lib/api-client'
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
import type { VisualEffectSceneKey } from '@/lib/timeloop/world-resolver'

type TimeloopMobileDrawersProps = {
  videoRef: React.RefObject<VideoBackgroundRef | null>
  leftDrawerOpen: boolean
  onLeftDrawerOpenChange: (open: boolean) => void
  rightDrawerOpen: boolean
  onRightDrawerOpenChange: (open: boolean) => void
  onGenerate: (prompt: string, scene: string) => void
  isAuthenticated: boolean
  onRequireAuth: () => void | Promise<boolean>
  onSignOut: () => void | Promise<void>
  isSigningOut?: boolean
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
  onToggleWorldInRotation?: (world: PublicGeneratedWorld) => void | Promise<void>
  isWorldInRotation?: (world: PublicGeneratedWorld) => boolean
  onCheckout: (kind: CheckoutKind) => void
  onDownload: () => void
  preferCreditPack: boolean
  isCnHost?: boolean
  cnWechatSupportId?: string
  selectedVisualEffect: VisualEffectSceneKey
  onVisualEffectChange: (scene: VisualEffectSceneKey) => void
  onEnterOfficialScene: (item: GallerySceneItem) => void
  streamLiveReadiness?: {
    rotationCount: number
    musicLabel: string
    imagesReady: boolean
    musicReady: boolean
    ready: boolean
  }
  streamerLiveLaunchedToday?: boolean
  onOneClickLiveStream?: () => void
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
  onSignOut,
  isSigningOut = false,
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
  onToggleWorldInRotation,
  isWorldInRotation,
  onCheckout,
  onDownload,
  preferCreditPack,
  isCnHost = false,
  cnWechatSupportId = '',
  selectedVisualEffect,
  onVisualEffectChange,
  onEnterOfficialScene,
  streamLiveReadiness,
  streamerLiveLaunchedToday,
  onOneClickLiveStream,
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
                  onSignOut={onSignOut}
                  isSigningOut={isSigningOut}
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
                  onToggleWorldInRotation={onToggleWorldInRotation}
                  isWorldInRotation={isWorldInRotation}
                  onCheckout={onCheckout}
                  onDownload={onDownload}
                  preferCreditPack={preferCreditPack}
                  isCnHost={isCnHost}
                  cnWechatSupportId={cnWechatSupportId}
                  selectedVisualEffect={selectedVisualEffect}
                  onVisualEffectChange={onVisualEffectChange}
                  streamLiveReadiness={streamLiveReadiness}
                  streamerLiveLaunchedToday={streamerLiveLaunchedToday}
                  onOneClickLiveStream={onOneClickLiveStream}
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
                  onEnterOfficialScene={onEnterOfficialScene}
                  myWorlds={savedWorlds}
                  onEnterMyWorld={onLoadWorld}
                  canToggleRotation={Boolean(userProfile?.hasCreatorTools)}
                  isWorldInRotation={(world) => Boolean(isWorldInRotation?.(world))}
                  onToggleWorldRotation={(world) => void onToggleWorldInRotation?.(world)}
                />
              </>
            ) : null}
          </DrawerContent>
        </Drawer>
      </div>
    </>
  )
}
