'use client'

import { useState, useCallback, useEffect, type ComponentType } from 'react'
import {
  Volume2,
  Mic,
  MicOff,
  Download,
  Settings,
  Sparkles,
  X,
  Maximize,
  Minimize,
  Music2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Plus,
  Layers,
} from 'lucide-react'
import LanguageSelector from '@/components/language-selector'
import GoogleSignInButton from '@/components/google-sign-in-button'
import CompanionPanel from '@/components/companion/companion-panel'
import type { useCompanion } from '@/hooks/use-companion'
import type { useGoogleCalendar } from '@/hooks/use-google-calendar'
import { useLanguage } from '@/lib/language-context'
import { getCommunityStrings } from '@/lib/community-i18n'
import type { RadioStation } from '@/lib/radio-station'
import {
  exitAppFullscreen,
  getFullscreenElement,
  requestAppFullscreen,
  subscribeFullscreenChange,
} from '@/lib/fullscreen'
import type { VideoBackgroundRef } from '@/components/ui/video-background'
import type { UserAccountProfile } from '@/lib/api-client'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import type { VisualEffectSceneKey } from '@/lib/timeloop/world-resolver'
import { VISUAL_EFFECT_SCENE_KEYS } from '@/lib/timeloop/world-resolver'
import CnManualUpgradePanel from '@/components/billing/cn-manual-upgrade-panel'

export interface MobileControlContentProps {
  videoRef: React.RefObject<VideoBackgroundRef | null>
  onGenerate: (prompt: string, scene: string) => void
  isAuthenticated: boolean
  onRequireAuth: () => void | Promise<boolean>
  isGenerating: boolean
  onClose: () => void
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
}

export default function MobileControlContent({
  videoRef,
  onGenerate,
  isAuthenticated,
  onRequireAuth,
  isGenerating,
  onClose,
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
  onMusicPlayingChange: setIsMusicPlaying,
  musicVolume,
  onMusicVolumeChange: setMusicVolume,
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
}: MobileControlContentProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFavoriteToast, setShowFavoriteToast] = useState(false)
  const [showSceneInput, setShowSceneInput] = useState(false)
  const [newSceneName, setNewSceneName] = useState('')
  const [isFavoritesHeartFilled, setIsFavoritesHeartFilled] = useState(false)
  const [prompt, setPrompt] = useState('')
  const { t, language } = useLanguage()
  const ct = getCommunityStrings(language)

  const scenes = VISUAL_EFFECT_SCENE_KEYS
  const stationLabel = currentStation?.name ?? t.music.scanning

  const handleToggleFavoriteClick = () => {
    if (!currentStation) return
    if (!isCurrentFavorited) {
      setShowFavoriteToast(true)
      window.setTimeout(() => setShowFavoriteToast(false), 2000)
    }
    onToggleFavorite()
  }

  const handleSaveScene = () => {
    if (!isAuthenticated) {
      void onRequireAuth()
      return
    }
    if (!activeWorldId || !newSceneName.trim()) return
    onRenameWorld(activeWorldId, newSceneName.trim())
    setNewSceneName('')
    setShowSceneInput(false)
  }

  const handleLoadScene = (world: PublicGeneratedWorld) => {
    onLoadWorld(world)
    setIsMusicPlaying(true)
  }

  const handleRemoveScene = (id: string) => {
    onDeleteWorld(id)
  }

  // Fullscreen toggle handler
  const handleFullscreenToggle = useCallback(() => {
    if (!getFullscreenElement()) {
      void requestAppFullscreen()
    } else {
      void exitAppFullscreen()
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    return subscribeFullscreenChange(() => {
      setIsFullscreen(Boolean(getFullscreenElement()))
    })
  }, [])

  const handleGenerate = () => {
    if (!prompt.trim()) return
    if (!isAuthenticated) {
      void onRequireAuth()
      return
    }
    onGenerate(prompt, selectedVisualEffect)
  }

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto p-4 max-md:landscape:p-3 max-md:landscape:text-[13px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between max-md:landscape:mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">{t.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Core Section - Input & Generate */}
      <div className="mb-6 space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.inputPlaceholder}
          className="glass h-24 w-full resize-none rounded-lg border border-foreground/10 bg-input/50 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-accent/50 focus:outline-none max-md:landscape:h-16"
        />

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">{t.sceneLabel}</label>
          <select
            value={selectedVisualEffect}
            onChange={(e) => onVisualEffectChange(e.target.value as VisualEffectSceneKey)}
            className="glass w-full rounded-lg border border-foreground/10 bg-input/50 px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none"
          >
            {scenes.map((scene) => (
              <option key={scene} value={scene} className="bg-popover text-foreground">
                {t.scenes[scene]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="animate-breathe flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-[0_0_25px_rgba(var(--accent)/0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:animate-none"
        >
          {isGenerating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? t.generating : t.generateButton}
        </button>
      </div>

      {/* Control Section */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-center gap-3">
          <MobileControlButton
            onClick={onDownload}
            icon={Download}
            label={t.controls.download}
          />
          <MobileControlButton
            onClick={onReopenMusicOnboarding}
            icon={Settings}
            label={t.music.changeMoods}
          />
        </div>
      </div>

      {/* Music Player Section */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center ${isMusicPlaying ? 'animate-pulse' : ''}`}>
              <Music2 className={`h-4 w-4 text-accent transition-all ${isMusicPlaying ? 'scale-110' : ''}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{t.music.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDjIntervalEnabledChange(!djIntervalEnabled)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] ${
                djIntervalEnabled
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-foreground/10 bg-secondary/30 text-muted-foreground'
              }`}
            >
              <span>{t.dj.intervalCompanion}</span>
            </button>
            <button
              type="button"
              onClick={() => onDjVoiceEnabledChange(!djVoiceEnabled)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] ${
                djVoiceEnabled
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-foreground/10 bg-secondary/30 text-muted-foreground'
              }`}
            >
              {djVoiceEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
              <span>{t.dj.label}</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              onClick={onPrevStation}
              disabled={isStationLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              className="min-w-0 flex-1 overflow-hidden rounded-lg border border-foreground/10 bg-secondary/30 px-2 py-2"
              title={isStationLoading ? undefined : stationLabel}
            >
              <span className="block truncate text-xs font-medium text-foreground">
                {isStationLoading ? t.music.scanning : stationLabel}
              </span>
            </div>

            <button
              onClick={onNextStation}
              disabled={isStationLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleToggleFavoriteClick}
              disabled={!currentStation}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 disabled:opacity-40 ${
                isCurrentFavorited
                  ? 'border-red-500/60 bg-red-500/25 text-red-500 shadow-[0_0_16px_rgba(239,68,68,0.7),0_0_32px_rgba(239,68,68,0.4)]'
                  : 'border-foreground/10 bg-secondary/50 text-foreground/70 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105'
              }`}
            >
              <Heart className={`h-4 w-4 transition-all duration-300 ${isCurrentFavorited ? 'fill-current scale-110 heart-glow-active' : ''}`} />
            </button>
          </div>
        </div>
        
        {showFavoriteToast && (
          <div className="flex items-center justify-center">
            <span className="text-xs text-accent animate-pulse">{t.music.alreadyFavorited}</span>
          </div>
        )}
        
        {isMusicPlaying && (
          <div className="flex items-end justify-center gap-1 h-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-accent/70 rounded-full animate-soundwave"
                style={{ animationDelay: `${i * 0.1}s`, height: '100%' }}
              />
            ))}
          </div>
        )}
        
        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <Volume2 className="h-3 w-3 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            className="h-1 flex-1 appearance-none rounded-full bg-secondary cursor-pointer accent-accent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(var(--accent)/0.5)]"
          />
          <span className="text-xs text-muted-foreground w-6 text-right">{musicVolume}</span>
        </div>
      </div>

      <CompanionPanel
        pomodoro={companion.pomodoro}
        onStartPomodoro={companion.startPomodoroTimer}
        onPausePomodoro={companion.pausePomodoroTimer}
        onResetPomodoro={companion.resetPomodoroTimer}
        onSkipPomodoro={companion.skipPomodoroTimer}
        alarms={companion.alarms}
        onAddAlarm={companion.addAlarm}
        onRemoveAlarm={companion.removeAlarm}
        onToggleAlarm={companion.toggleAlarm}
        calendarEvents={calendar.calendarEvents}
        calendarConnected={calendar.calendarConnected}
        calendarLoading={calendar.calendarLoading}
        isAuthenticated={isAuthenticated}
        onConnectCalendar={() => void calendar.connectCalendar()}
      />

      {/* My Favorites Section */}
      <div className="mb-6 space-y-2">
        <button 
          onClick={() => setIsFavoritesHeartFilled(!isFavoritesHeartFilled)}
          className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
        >
          <Heart className={`h-4 w-4 transition-all duration-300 ${isFavoritesHeartFilled ? 'fill-current text-red-500 heart-glow-active scale-110' : 'text-red-500'}`} />
          <span className="text-xs font-medium text-muted-foreground">{t.music.favorites}</span>
        </button>
        
        {favoriteStations.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">{t.music.noFavorites}</p>
        ) : (
          <div className="space-y-1">
            {favoriteStations.map((station) => (
              <div
                key={station.stationuuid}
                className="group flex items-center justify-between rounded-lg border border-foreground/10 bg-secondary/30 px-3 py-2 transition-all hover:border-foreground/20 hover:bg-secondary/50"
              >
                <button
                  onClick={() => {
                    onPlayFavorite(station)
                    setIsMusicPlaying(true)
                  }}
                  className="flex-1 text-left text-xs text-foreground/80 transition-colors hover:text-foreground"
                >
                  {station.name}
                </button>
                <button
                  onClick={() => onRemoveFavorite(station.stationuuid)}
                  className="ml-2 flex h-6 w-6 items-center justify-center rounded hover:bg-red-500/20"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Scenes Section */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">{t.myScenes.title}</span>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                void onRequireAuth()
                return
              }
              if (!activeWorldId) return
              setShowSceneInput(true)
            }}
            disabled={!activeWorldId}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-accent/50 hover:bg-accent/20 hover:text-accent hover:shadow-[0_0_10px_rgba(var(--accent)/0.3)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {showSceneInput && (
          <div className="glass animate-fade-in-up space-y-2 rounded-lg border border-accent/40 bg-popover/60 p-3 shadow-[0_0_20px_rgba(var(--accent)/0.2)]">
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder={t.myScenes.namePlaceholder}
              className="glass w-full rounded-md border border-foreground/20 bg-input/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-accent/50 focus:outline-none focus:shadow-[0_0_10px_rgba(var(--accent)/0.3)]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveScene()
                if (e.key === 'Escape') setShowSceneInput(false)
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSceneInput(false)}
                className="flex-1 rounded-md border border-foreground/10 bg-secondary/50 px-3 py-2 text-sm text-foreground/70 transition-all hover:bg-secondary"
              >
                {t.myScenes.cancel}
              </button>
              <button
                onClick={handleSaveScene}
                disabled={!newSceneName.trim()}
                className="flex-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-[0_0_12px_rgba(var(--accent)/0.4)] disabled:opacity-50"
              >
                {t.myScenes.confirm}
              </button>
            </div>
          </div>
        )}
        
        {savedWorlds.length === 0 && !showSceneInput ? (
          <p className="text-xs text-muted-foreground/60 italic">
            {isAuthenticated ? t.myScenes.noScenes : t.myScenes.loginRequired}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {savedWorlds.map((world, index) => (
              <div
                key={world.id}
                className={`glass group animate-fade-in-up relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all duration-300 hover:border-accent/40 hover:bg-accent/15 hover:shadow-[0_0_12px_rgba(var(--accent)/0.25)] ${
                  world.id === activeWorldId
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-foreground/15 bg-popover/50'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <button
                  onClick={() => handleLoadScene(world)}
                  className="max-w-[100px] truncate text-xs text-foreground/80 transition-colors hover:text-foreground"
                  title={world.title}
                >
                  {world.title}
                </button>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      const makePublic = world.isPrivate !== false
                      if (makePublic && !window.confirm(ct.publishConfirm)) return
                      void onPublishWorld(world.id, makePublic)
                    }}
                    className="text-[9px] text-accent"
                  >
                    {world.isPrivate === false ? '●' : '○'}
                  </button>
                ) : null}
                <button
                  onClick={() => handleRemoveScene(world.id)}
                  className="flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-all hover:bg-red-500/20 group-hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Fullscreen Toggle */}
      <div className="mb-4">
        <button
          onClick={handleFullscreenToggle}
          className="hover-flowing-glow flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/10 bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground/80 transition-all duration-300 hover:border-blue-500/50 hover:bg-secondary hover:text-foreground"
        >
          {isFullscreen ? (
            <>
              <Minimize className="h-4 w-4" />
              {t.controls.exitFullscreen}
            </>
          ) : (
            <>
              <Maximize className="h-4 w-4" />
              {t.controls.fullscreen}
            </>
          )}
        </button>
      </div>

      {/* Sign in */}
      {!isAuthenticated ? (
        <div className="space-y-2 border-t border-foreground/10 pt-4">
          <p className="text-xs text-muted-foreground">{t.auth.signInPrompt}</p>
          <GoogleSignInButton onClick={() => void onRequireAuth()} />
        </div>
      ) : null}

      {/* Membership Info */}
      <div className="space-y-2 border-t border-foreground/10 pt-4 text-xs text-muted-foreground">
        {userProfile?.isVip ? (
          <p className="text-accent">{t.membership.vipActive}</p>
        ) : (
          <>
            <p>
              {t.membership.creditsRemaining.replace(
                '{count}',
                String(userProfile?.remainingCredits ?? 5),
              )}
            </p>
            <p>{t.membership.free}</p>
          </>
        )}
        <p className="text-accent">{t.membership.vip}</p>
        <div className="flex flex-col gap-2 pt-1">
          {preferCreditPack || isCnHost ? (
            <CnManualUpgradePanel
              userId={userProfile?.id}
              wechatSupportId={cnWechatSupportId}
              title={t.streamerOverlay.cnManualTitle}
              description={t.streamerOverlay.cnManualDescription}
              wechatLabel={t.streamerOverlay.cnWechatLabel}
              uidHint={t.streamerOverlay.cnUidHint}
              copyLabel={t.streamerOverlay.cnCopyUid}
            />
          ) : null}
          {!userProfile?.isVip && !preferCreditPack && !isCnHost ? (
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  void onRequireAuth()
                  return
                }
                onCheckout('subscription')
              }}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition hover:bg-accent/90"
            >
              {t.membership.upgradeVip}
            </button>
          ) : null}
          {!userProfile?.isVip && !preferCreditPack && !isCnHost ? (
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  void onRequireAuth()
                  return
                }
                onCheckout('credits')
              }}
              className="rounded-lg border border-accent/40 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/10"
            >
              {t.membership.buyCredits}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

interface MobileControlButtonProps {
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}

function MobileControlButton({ onClick, icon: Icon, label }: MobileControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg border border-foreground/10 bg-secondary/50 px-4 py-2 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px]">{label}</span>
    </button>
  )
}