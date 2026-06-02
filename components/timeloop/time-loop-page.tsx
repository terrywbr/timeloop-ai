'use client'

import ControlPanel from '@/components/control-panel'
import AudioUnlockButton from '@/components/audio-unlock-button'
import MobileEntryGate from '@/components/mobile-entry-gate'
import CommunityGallery from '@/components/community-gallery'
import StreamAudioPlayer from '@/components/stream-audio-player'
import AmbientBackground from '@/components/timeloop/ambient-background'
import GeneratingOverlay from '@/components/timeloop/generating-overlay'
import RegionPrompt from '@/components/timeloop/region-prompt'
import TimeloopMobileDrawers from '@/components/timeloop/mobile-drawers'
import MusicMoodOnboarding from '@/components/music/music-mood-onboarding'
import NowPlayingTuner from '@/components/music/now-playing-tuner'
import { LanguageProvider } from '@/lib/language-context'
import { useTimeloopPage } from '@/hooks/use-timeloop-page'

export default function TimeLoopPage() {
  const page = useTimeloopPage()

  const handleToggleFavorite = () => {
    if (page.currentStation) {
      page.handleToggleFavorite()
    }
  }

  return (
    <LanguageProvider>
      {page.showMobileGate ? <MobileEntryGate onTap={page.handleMobileGateTap} /> : null}

      {page.showMusicOnboarding ? (
        <MusicMoodOnboarding onComplete={page.handleCompleteMusicOnboarding} />
      ) : null}

      {page.pastMobileGate && page.activeMusicStreamUrl ? (
        <StreamAudioPlayer
          streamUrl={page.activeMusicStreamUrl}
          playing={page.isMusicPlaying}
          volume={page.musicVolume}
          muted={!page.isAudioUnlocked}
          onPlaybackError={(url) => void page.handleStreamFailure(url)}
        />
      ) : null}

      {page.showCockpit ? (
        <main className="timeloop-app-shell relative h-screen w-screen overflow-hidden bg-background">
          <AmbientBackground layers={page.ambientLayers} />

          <StreamAudioPlayer
            streamUrl={page.activeAmbienceUrl}
            playing={page.isMusicPlaying}
            volume={page.ambienceVolume}
            muted={!page.isAudioUnlocked}
            loop
          />

          <NowPlayingTuner station={page.tunerStation} />

          {!page.isAudioUnlocked && !page.isMobile && !page.musicOnboarded ? (
            <AudioUnlockButton onUnlock={page.handleUnlockAudio} />
          ) : null}

          {page.showRegionPrompt ? (
            <RegionPrompt
              onChooseGlobal={() => page.chooseRegion('global')}
              onChooseCn={() => page.chooseRegion('cn')}
            />
          ) : null}

          <ControlPanel
            videoRef={page.videoRef}
            onGenerate={page.handleGenerate}
            isAuthenticated={Boolean(page.authUser)}
            onRequireAuth={page.handleRequireAuth}
            isGenerating={page.isGenerating}
            isExpanded={page.leftPanelExpanded}
            onExpandedChange={page.setLeftPanelExpanded}
            currentStation={page.currentStation}
            isStationLoading={page.isStationLoading}
            isCurrentFavorited={page.isCurrentFavorited}
            favoriteStations={page.favoriteStations}
            onNextStation={() => void page.handleNextStation()}
            onPrevStation={() => void page.handlePrevStation()}
            onToggleFavorite={handleToggleFavorite}
            onPlayFavorite={page.handlePlayFavorite}
            onRemoveFavorite={page.handleRemoveFavorite}
            onReopenMusicOnboarding={page.reopenMusicOnboarding}
            isMusicPlaying={page.isMusicPlaying}
            onMusicPlayingChange={page.handleMusicPlayingChange}
            musicVolume={page.musicVolume}
            onMusicVolumeChange={page.setMusicVolume}
            userProfile={page.userProfile}
            savedWorlds={page.savedWorlds}
            activeWorldId={page.activeWorldId}
            onLoadWorld={page.handleLoadWorld}
            onDeleteWorld={page.handleDeleteWorld}
            onRenameWorld={page.handleRenameWorld}
            onCheckout={page.handleCheckout}
            onDownload={page.handleDownload}
            preferCreditPack={page.preferCreditPack}
          />

          <CommunityGallery
            isExpanded={page.rightPanelExpanded}
            onExpandedChange={page.setRightPanelExpanded}
            onEnterScene={page.handleEnterGalleryScene}
          />

          <TimeloopMobileDrawers
            videoRef={page.videoRef}
            leftDrawerOpen={page.leftDrawerOpen}
            onLeftDrawerOpenChange={page.setLeftDrawerOpen}
            rightDrawerOpen={page.rightDrawerOpen}
            onRightDrawerOpenChange={page.setRightDrawerOpen}
            onGenerate={page.handleGenerate}
            isAuthenticated={Boolean(page.authUser)}
            onRequireAuth={page.handleRequireAuth}
            isGenerating={page.isGenerating}
            currentStation={page.currentStation}
            isStationLoading={page.isStationLoading}
            isCurrentFavorited={page.isCurrentFavorited}
            favoriteStations={page.favoriteStations}
            onNextStation={() => void page.handleNextStation()}
            onPrevStation={() => void page.handlePrevStation()}
            onToggleFavorite={handleToggleFavorite}
            onPlayFavorite={page.handlePlayFavorite}
            onRemoveFavorite={page.handleRemoveFavorite}
            onReopenMusicOnboarding={page.reopenMusicOnboarding}
            isMusicPlaying={page.isMusicPlaying}
            onMusicPlayingChange={page.handleMusicPlayingChange}
            musicVolume={page.musicVolume}
            onMusicVolumeChange={page.setMusicVolume}
            userProfile={page.userProfile}
            savedWorlds={page.savedWorlds}
            activeWorldId={page.activeWorldId}
            onLoadWorld={page.handleLoadWorld}
            onDeleteWorld={page.handleDeleteWorld}
            onRenameWorld={page.handleRenameWorld}
            onCheckout={page.handleCheckout}
            onDownload={page.handleDownload}
            preferCreditPack={page.preferCreditPack}
            onEnterScene={page.handleEnterGalleryScene}
          />

          {page.isGenerating ? <GeneratingOverlay /> : null}
        </main>
      ) : null}
    </LanguageProvider>
  )
}
