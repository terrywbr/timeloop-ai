'use client'

import { useLanguage } from '@/lib/language-context'
import type { MusicMoodId } from '@/lib/music-moods'
import { useTimeloopPage } from '@/hooks/use-timeloop-page'
import ControlPanel from '@/components/control-panel'
import AudioUnlockButton from '@/components/audio-unlock-button'
import CommunityGallery from '@/components/community-gallery'
import StreamLayout from '@/components/stream/stream-layout'
import StreamAudioPlayer from '@/components/stream-audio-player'
import AmbientBackground from '@/components/timeloop/ambient-background'
import GeneratingOverlay from '@/components/timeloop/generating-overlay'
import RegionPrompt from '@/components/timeloop/region-prompt'
import TimeloopMobileDrawers from '@/components/timeloop/mobile-drawers'
import MusicMoodOnboarding from '@/components/music/music-mood-onboarding'
import NowPlayingTuner from '@/components/music/now-playing-tuner'
import AiDjOverlay from '@/components/music/ai-dj-overlay'
import PortraitRotateOverlay from '@/components/portrait-rotate-overlay'
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
      {!page.isClientMounted ? (
        <div className="fixed inset-0 z-[240] bg-zinc-950" aria-hidden />
      ) : null}

      {page.showPortraitRotateGate ? <PortraitRotateOverlay /> : null}

      {page.showMusicOnboarding ? (
        <MusicMoodOnboarding onComplete={page.handleCompleteMusicOnboarding} />
      ) : null}

      {!page.showStreamLayout && page.activeMusicStreamUrl ? (
        <StreamAudioPlayer
          streamUrl={page.activeMusicStreamUrl}
          playing={page.isMusicPlaying}
          volume={page.effectiveMusicVolume}
          muted={!page.isAudioUnlocked}
          streamMode
          onPlaybackError={(url) => void page.handleStreamFailure(url)}
        />
      ) : null}

      {page.showStreamLayout ? (
        <StreamLayout
          ambientLayers={page.ambientLayers}
          overlaySettings={page.effectiveOverlaySettings}
          isFoundingCreator={Boolean(page.userProfile?.isFoundingCreator)}
          isStreamer={Boolean(page.userProfile?.isStreamerPlan)}
          musicStreamUrl={page.activeMusicStreamUrl}
          isMusicPlaying={page.isMusicPlaying}
          musicVolume={page.effectiveMusicVolume}
          isAudioUnlocked={page.isAudioUnlocked}
          onPlaybackError={(url) => void page.handleStreamFailure(url)}
        />
      ) : null}

      {page.showCockpit ? (
        <main className="timeloop-app-shell relative h-screen w-screen overflow-hidden bg-background">
          <AmbientBackground layers={page.ambientLayers} />

          <NowPlayingTuner station={page.tunerStation} />
          <AiDjOverlay aiDj={page.aiDj} onDismiss={page.dismissAiDj} />

          {!page.isAudioUnlocked && !page.isMobile && page.musicOnboarded ? (
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
            onSignOut={page.handleSignOut}
            isSigningOut={page.isSigningOut}
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
            onPublishWorld={page.handlePublishWorld}
            onToggleWorldInRotation={page.handleToggleWorldInStreamerRotation}
            isWorldInRotation={page.isWorldInStreamerRotation}
            onCheckout={page.handleCheckout}
            onDownload={page.handleDownload}
            preferCreditPack={page.preferCreditPack}
            isCnHost={page.isCnHost}
            cnWechatSupportId={process.env.NEXT_PUBLIC_CN_WECHAT_SUPPORT_ID ?? ''}
            selectedVisualEffect={page.selectedVisualEffect}
            onVisualEffectChange={page.setSelectedVisualEffect}
            streamLiveReadiness={page.streamLiveReadiness}
            streamerLiveLaunchedToday={page.streamerLiveLaunchedToday}
            onOneClickLiveStream={page.handleOneClickLiveStream}
          />

          <CommunityGallery
            isExpanded={page.rightPanelExpanded}
            onExpandedChange={page.setRightPanelExpanded}
            myWorlds={page.savedWorlds}
            onEnterMyWorld={page.handleLoadWorld}
            canToggleRotation={page.hasCreatorTools}
            isWorldInRotation={page.isWorldInStreamerRotation}
            onToggleWorldRotation={page.handleToggleWorldInStreamerRotation}
            onEnterOfficialScene={page.handleEnterGalleryScene}
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
            onSignOut={page.handleSignOut}
            isSigningOut={page.isSigningOut}
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
            isCnHost={page.isCnHost}
            cnWechatSupportId={process.env.NEXT_PUBLIC_CN_WECHAT_SUPPORT_ID ?? ''}
            selectedVisualEffect={page.selectedVisualEffect}
            onVisualEffectChange={page.setSelectedVisualEffect}
            onPublishWorld={page.handlePublishWorld}
            onToggleWorldInRotation={page.handleToggleWorldInStreamerRotation}
            isWorldInRotation={page.isWorldInStreamerRotation}
            onEnterOfficialScene={page.handleEnterGalleryScene}
            streamLiveReadiness={page.streamLiveReadiness}
            streamerLiveLaunchedToday={page.streamerLiveLaunchedToday}
            onOneClickLiveStream={page.handleOneClickLiveStream}
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
