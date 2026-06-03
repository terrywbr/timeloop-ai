'use client'

import { useLanguage } from '@/lib/language-context'
import type { MusicMoodId } from '@/lib/music-moods'
import { useTimeloopPage } from '@/hooks/use-timeloop-page'
import ControlPanel from '@/components/control-panel'
import AudioUnlockButton from '@/components/audio-unlock-button'
import CommunityGallery from '@/components/community-gallery'
import StreamAudioPlayer from '@/components/stream-audio-player'
import AmbientBackground from '@/components/timeloop/ambient-background'
import GeneratingOverlay from '@/components/timeloop/generating-overlay'
import RegionPrompt from '@/components/timeloop/region-prompt'
import TimeloopMobileDrawers from '@/components/timeloop/mobile-drawers'
import MusicMoodOnboarding from '@/components/music/music-mood-onboarding'
import NowPlayingTuner from '@/components/music/now-playing-tuner'
import AiDjOverlay from '@/components/music/ai-dj-overlay'
import { LanguageProvider } from '@/lib/language-context'

function TimeLoopPageInner() {
  const { language, t } = useLanguage()
  const page = useTimeloopPage({
    language,
    getDjPersonaName: (moodId: MusicMoodId) => t.dj.personas[moodId].name,
  })

  const handleToggleFavorite = () => {
    if (page.currentStation) {
      page.handleToggleFavorite()
    }
  }

  return (
    <>
      {page.showMusicOnboarding ? (
        <MusicMoodOnboarding onComplete={page.handleCompleteMusicOnboarding} />
      ) : null}

      {page.musicOnboarded && page.activeMusicStreamUrl ? (
        <StreamAudioPlayer
          streamUrl={page.activeMusicStreamUrl}
          playing={page.isMusicPlaying}
          volume={page.effectiveMusicVolume}
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
          <AiDjOverlay aiDj={page.aiDj} onDismiss={page.dismissAiDj} />

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
            onReopenMusicOnboarding={page.handleReopenMusicOnboarding}
            djVoiceEnabled={page.aiDj.voiceEnabled}
            onDjVoiceEnabledChange={page.setDjVoiceEnabled}
            djIntervalEnabled={page.aiDj.intervalEnabled}
            onDjIntervalEnabledChange={page.setDjIntervalEnabled}
            companion={page.companion}
            calendar={page.calendar}
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
            onReopenMusicOnboarding={page.handleReopenMusicOnboarding}
            djVoiceEnabled={page.aiDj.voiceEnabled}
            onDjVoiceEnabledChange={page.setDjVoiceEnabled}
            djIntervalEnabled={page.aiDj.intervalEnabled}
            onDjIntervalEnabledChange={page.setDjIntervalEnabled}
            companion={page.companion}
            calendar={page.calendar}
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
    </>
  )
}

export default function TimeLoopPage() {
  return (
    <LanguageProvider>
      <TimeLoopPageInner />
    </LanguageProvider>
  )
}
