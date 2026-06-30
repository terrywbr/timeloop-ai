'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Volume2,
  Mic,
  MicOff,
  Download,
  Settings,
  Sparkles,
  ChevronRight,
  Maximize,
  Minimize,
  Music2,
  ChevronLeft,
  Heart,
  X,
} from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import LanguageSelector from './language-selector'
import type { VideoBackgroundRef } from './ui/video-background'
import type { RadioStation } from '@/lib/radio-station'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import type { UserAccountProfile, CheckoutKind } from '@/lib/api-client'
import GoogleSignInButton from '@/components/google-sign-in-button'
import SignOutButton from '@/components/sign-out-button'
import {
  exitAppFullscreen,
  getFullscreenElement,
  requestAppFullscreen,
  subscribeFullscreenChange,
} from '@/lib/fullscreen'
import { VISUAL_EFFECT_SCENE_KEYS, type VisualEffectSceneKey } from '@/lib/timeloop/world-resolver'
import MembershipPanel from '@/components/billing/membership-panel'
import StreamerLivePanel from '@/components/streamer/streamer-live-panel'

interface ControlPanelProps {
  videoRef: React.RefObject<VideoBackgroundRef | null>
  onGenerate: (prompt: string, scene: string) => void
  isAuthenticated: boolean
  onRequireAuth: (options?: { requestFullscreen?: boolean }) => void | Promise<boolean>
  onSignOut: () => void | Promise<void>
  isSigningOut?: boolean
  isGenerating: boolean
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
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

export default function ControlPanel({
  videoRef,
  onGenerate,
  isAuthenticated,
  onRequireAuth,
  onSignOut,
  isSigningOut = false,
  isGenerating,
  isExpanded,
  onExpandedChange,
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
  onToggleWorldInRotation,
  isWorldInRotation,
  onCheckout,
  onDownload,
  preferCreditPack,
  isCnHost = false,
  cnWechatSupportId = '',
  selectedVisualEffect,
  onVisualEffectChange,
  streamLiveReadiness,
  streamerLiveLaunchedToday = false,
  onOneClickLiveStream,
}: ControlPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFavoriteToast, setShowFavoriteToast] = useState(false)
  const [isFavoritesHeartFilled, setIsFavoritesHeartFilled] = useState(false)
  const [prompt, setPrompt] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { t, language } = useLanguage()

  const scenes = VISUAL_EFFECT_SCENE_KEYS

  const startCollapseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onExpandedChange(false)
    }, 3000)
  }, [onExpandedChange])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onExpandedChange(true)
  }

  const handleMouseLeave = () => {
    startCollapseTimer()
  }

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return
    if (!isAuthenticated) {
      void onRequireAuth({ requestFullscreen: true })
      return
    }
    onGenerate(prompt, selectedVisualEffect)
  }

  const handleToggleFavoriteClick = () => {
    if (!currentStation) return
    if (!isCurrentFavorited) {
      setShowFavoriteToast(true)
      window.setTimeout(() => setShowFavoriteToast(false), 2000)
    }
    onToggleFavorite()
  }

  const stationLabel = currentStation?.name ?? t.music.scanning

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

  // Mobile touch handling
  const handleTouchStart = () => {
    if (!isExpanded) {
      onExpandedChange(true)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Panel */}
      <div
        ref={panelRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        className={`fixed left-0 top-0 z-50 hidden h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:block ${
          isExpanded ? 'w-[280px]' : 'w-[40px]'
        }`}
      >
        {/* Collapsed state - thin bar */}
        <div
          className={`glass absolute inset-0 border-r border-foreground/10 transition-all duration-500 ${
            isExpanded
              ? 'bg-popover/70'
              : 'bg-popover/30'
          }`}
        />

        {/* Collapse indicator when collapsed */}
        {!isExpanded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ChevronRight className="h-5 w-5 animate-pulse text-foreground/50" />
          </div>
        )}

        {/* Expanded content */}
        <div
          className={`no-scrollbar relative flex h-full min-w-0 flex-col overflow-y-auto overflow-x-hidden p-4 transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">{t.title}</h1>
            </div>
            <LanguageSelector />
          </div>

          {/* Core Section - Input & Generate */}
          <div className="mb-6 space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="glass h-20 w-full resize-none rounded-lg border border-foreground/10 bg-input/50 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-accent/50 focus:outline-none"
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
              className="animate-breathe flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-[0_0_25px_rgba(var(--accent)/0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:animate-none"
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
            <div className="flex items-center gap-2">
              <ControlButton
                onClick={onDownload}
                icon={Download}
                tooltip={userProfile?.hasDownloadAccess ? t.controls.download : `${t.controls.download} (VIP)`}
              />
              <ControlButton
                onClick={onReopenMusicOnboarding}
                icon={Settings}
                tooltip={t.music.changeMoods}
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
              <button
                type="button"
                onClick={() => onDjVoiceEnabledChange(!djVoiceEnabled)}
                title={
                  djVoiceEnabled
                    ? `${t.dj.voiceOn} · ${t.dj.intervalCompanion}`
                    : t.dj.voiceOff
                }
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] transition-all ${
                  djVoiceEnabled
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-foreground/10 bg-secondary/30 text-muted-foreground'
                }`}
              >
                {djVoiceEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                <span>{t.dj.label}</span>
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <button
                  onClick={onPrevStation}
                  disabled={isStationLoading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div
                  className="min-w-0 flex-1 overflow-hidden rounded-lg border border-foreground/10 bg-secondary/30 px-2 py-1.5"
                  title={isStationLoading ? undefined : stationLabel}
                >
                  <span className="block truncate text-xs font-medium text-foreground">
                    {isStationLoading ? t.music.scanning : stationLabel}
                  </span>
                </div>

                <button
                  onClick={onNextStation}
                  disabled={isStationLoading}
                  title={t.music.nextStation}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleToggleFavoriteClick}
                  disabled={!currentStation}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 disabled:opacity-40 ${
                    isCurrentFavorited
                      ? 'border-red-500/60 bg-red-500/25 text-red-500 shadow-[0_0_16px_rgba(239,68,68,0.7),0_0_32px_rgba(239,68,68,0.4)]'
                      : 'border-foreground/10 bg-secondary/50 text-foreground/70 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105'
                  }`}
                  title={isCurrentFavorited ? t.music.alreadyFavorited : t.music.favorites}
                >
                  <Heart className={`h-4 w-4 transition-all duration-300 ${isCurrentFavorited ? 'fill-current scale-110 heart-glow-active' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Already favorited toast */}
            {showFavoriteToast && (
              <div className="flex items-center justify-center">
                <span className="text-xs text-accent animate-pulse">{t.music.alreadyFavorited}</span>
              </div>
            )}
            
            {/* Sound Wave Animation */}
            {isMusicPlaying && (
              <div className="flex items-end justify-center gap-1 h-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-accent/70 rounded-full animate-soundwave"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: '100%',
                    }}
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

            {/* Station list removed — use Next to discover global stations */}

          </div>

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
                    className="group flex items-center justify-between rounded-lg border border-foreground/10 bg-secondary/30 px-2 py-1.5 transition-all hover:border-foreground/20 hover:bg-secondary/50"
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
                      className="ml-2 flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all hover:bg-red-500/20 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {userProfile?.hasCreatorTools && streamLiveReadiness && onOneClickLiveStream ? (
            <StreamerLivePanel
              rotationCount={streamLiveReadiness.rotationCount}
              musicLabel={streamLiveReadiness.musicLabel}
              imagesReady={streamLiveReadiness.imagesReady}
              musicReady={streamLiveReadiness.musicReady}
              ready={streamLiveReadiness.ready}
              launchedToday={streamerLiveLaunchedToday}
              onLaunch={onOneClickLiveStream}
            />
          ) : null}

          {/* Fullscreen Toggle */}
          <div className="mb-4">
            <button
              onClick={handleFullscreenToggle}
              className="hover-flowing-glow flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/10 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground/80 transition-all duration-300 hover:border-blue-500/50 hover:bg-secondary hover:text-foreground"
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
            <div className="mb-4 space-y-2 border-t border-foreground/10 pt-4">
              <p className="text-xs text-muted-foreground">{t.auth.signInPrompt}</p>
              <GoogleSignInButton onClick={() => void onRequireAuth({ requestFullscreen: true })} />
            </div>
          ) : (
            <div className="mb-4 space-y-2 border-t border-foreground/10 pt-4">
              <SignOutButton
                label={t.auth.signOut}
                onClick={() => void onSignOut()}
                loading={isSigningOut}
              />
            </div>
          )}

          <MembershipPanel
            userProfile={userProfile}
            isAuthenticated={isAuthenticated}
            preferCreditPack={preferCreditPack}
            isCnHost={isCnHost}
            cnWechatSupportId={cnWechatSupportId}
            onRequireAuth={onRequireAuth}
            onCheckout={onCheckout}
          />
        </div>
      </div>
    </>
  )
}

interface ControlButtonProps {
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
}

function ControlButton({ onClick, icon: Icon, tooltip }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground"
      title={tooltip}
    >
      <Icon className="h-4 w-4" />
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {tooltip}
      </span>
    </button>
  )
}
