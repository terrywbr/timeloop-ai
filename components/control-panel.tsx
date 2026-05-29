'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
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
  Plus,
  Layers,
} from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import LanguageSelector from './language-selector'
import type { VideoBackgroundRef } from './ui/video-background'
import { MUSIC_CHANNELS, type MusicChannelKey } from '@/lib/music-channels'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import type { UserAccountProfile } from '@/lib/api-client'
import GoogleSignInButton from '@/components/google-sign-in-button'
import {
  exitAppFullscreen,
  getFullscreenElement,
  requestAppFullscreen,
  subscribeFullscreenChange,
} from '@/lib/fullscreen'

interface ControlPanelProps {
  videoRef: React.RefObject<VideoBackgroundRef | null>
  onGenerate: (prompt: string, scene: string) => void
  isAuthenticated: boolean
  onRequireAuth: () => void | Promise<boolean>
  isGenerating: boolean
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
  musicChannelIndex: number
  onMusicChannelIndexChange: (index: number) => void
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
  onCheckout: (kind: 'subscription' | 'credits') => void
  onDownload: () => void
  preferCreditPack: boolean
}

type SceneKey = 'cyberpunk' | 'nature' | 'space' | 'ocean' | 'city' | 'desert'

export default function ControlPanel({
  videoRef,
  onGenerate,
  isAuthenticated,
  onRequireAuth,
  isGenerating,
  isExpanded,
  onExpandedChange,
  musicChannelIndex: currentChannelIndex,
  onMusicChannelIndexChange: setCurrentChannelIndex,
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
  onCheckout,
  onDownload,
  preferCreditPack,
}: ControlPanelProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [favoriteChannels, setFavoriteChannels] = useState<MusicChannelKey[]>([])
  const [showFavoriteToast, setShowFavoriteToast] = useState(false)
  const [showSceneInput, setShowSceneInput] = useState(false)
  const [newSceneName, setNewSceneName] = useState('')
  const [isFavoritesHeartFilled, setIsFavoritesHeartFilled] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [selectedScene, setSelectedScene] = useState<SceneKey>('cyberpunk')
  const panelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { t } = useLanguage()

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('musicFavorites')
    if (savedFavorites) {
      try {
        setFavoriteChannels(JSON.parse(savedFavorites))
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [])

  const scenes: SceneKey[] = ['cyberpunk', 'nature', 'space', 'ocean', 'city', 'desert']

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

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
      setIsPaused(!isPaused)
    }
  }

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.toggleMute()
      setIsMuted(!isMuted)
    }
  }

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }
    onGenerate(prompt, selectedScene)
  }

  // Music player handlers
  const handleMusicToggle = () => {
    setIsMusicPlaying(!isMusicPlaying)
  }

  const handlePrevChannel = () => {
    setCurrentChannelIndex(
      currentChannelIndex === 0 ? MUSIC_CHANNELS.length - 1 : currentChannelIndex - 1
    )
  }

  const handleNextChannel = () => {
    setCurrentChannelIndex((currentChannelIndex + 1) % MUSIC_CHANNELS.length)
  }

  const currentChannel = MUSIC_CHANNELS[currentChannelIndex]
  const isCurrentFavorited = favoriteChannels.includes(currentChannel.key)

  // Toggle favorite for current channel
  const handleToggleFavorite = () => {
    if (isCurrentFavorited) {
      // Remove from favorites
      const newFavorites = favoriteChannels.filter(key => key !== currentChannel.key)
      setFavoriteChannels(newFavorites)
      localStorage.setItem('musicFavorites', JSON.stringify(newFavorites))
    } else {
      // Add to favorites
      const newFavorites = [...favoriteChannels, currentChannel.key]
      setFavoriteChannels(newFavorites)
      localStorage.setItem('musicFavorites', JSON.stringify(newFavorites))
      // Show toast briefly
      setShowFavoriteToast(true)
      setTimeout(() => setShowFavoriteToast(false), 2000)
    }
  }

  // Remove specific channel from favorites
  const handleRemoveFavorite = (key: MusicChannelKey) => {
    const newFavorites = favoriteChannels.filter(k => k !== key)
    setFavoriteChannels(newFavorites)
    localStorage.setItem('musicFavorites', JSON.stringify(newFavorites))
  }

  // Switch to a favorite channel
  const handlePlayFavorite = (key: MusicChannelKey) => {
    const index = MUSIC_CHANNELS.findIndex(ch => ch.key === key)
    if (index !== -1) {
      setCurrentChannelIndex(index)
      setIsMusicPlaying(true)
    }
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
          className={`no-scrollbar relative flex h-full flex-col overflow-y-auto p-4 transition-opacity duration-300 ${
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
                value={selectedScene}
                onChange={(e) => setSelectedScene(e.target.value as SceneKey)}
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
                onClick={handlePlayPause}
                icon={isPaused ? Play : Pause}
                tooltip={isPaused ? t.controls.play : t.controls.pause}
              />
              <ControlButton
                onClick={handleMuteToggle}
                icon={isMuted ? VolumeX : Volume2}
                tooltip={isMuted ? t.controls.unmute : t.controls.mute}
              />
              <ControlButton
                onClick={onDownload}
                icon={Download}
                tooltip={userProfile?.isVip ? t.controls.download : `${t.controls.download} (VIP)`}
              />
              <ControlButton
                onClick={() => {}}
                icon={Settings}
                tooltip={t.controls.settings}
              />
            </div>
          </div>

          {/* Music Player Section */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center ${isMusicPlaying ? 'animate-pulse' : ''}`}>
                <Music2 className={`h-4 w-4 text-accent transition-all ${isMusicPlaying ? 'scale-110' : ''}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t.music.title}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Prev Channel */}
              <button
                onClick={handlePrevChannel}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Channel Display */}
              <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-foreground/10 bg-secondary/30 px-3 py-1.5">
                <span className="truncate text-xs font-medium text-foreground">
                  {t.music.channels[currentChannel.key]}
                </span>
              </div>
              
              {/* Next Channel */}
              <button
                onClick={handleNextChannel}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Play/Pause Music */}
              <button
                onClick={handleMusicToggle}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                  isMusicPlaying 
                    ? 'border-accent/50 bg-accent/20 text-accent' 
                    : 'border-foreground/10 bg-secondary/50 text-foreground/70 hover:border-foreground/20 hover:bg-secondary hover:text-foreground'
                }`}
              >
                {isMusicPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              
              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300 ${
                  isCurrentFavorited 
                    ? 'border-red-500/60 bg-red-500/25 text-red-500 shadow-[0_0_16px_rgba(239,68,68,0.7),0_0_32px_rgba(239,68,68,0.4)]' 
                    : 'border-foreground/10 bg-secondary/50 text-foreground/70 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105'
                }`}
                title={isCurrentFavorited ? t.music.alreadyFavorited : t.music.favorites}
              >
                <Heart className={`h-4 w-4 transition-all duration-300 ${isCurrentFavorited ? 'fill-current scale-110 heart-glow-active' : ''}`} />
              </button>
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

            {/* Station list — tap to play stream */}
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                {t.music.stations}
              </p>
              <div className="space-y-1">
                {MUSIC_CHANNELS.map((ch, index) => (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => {
                      setCurrentChannelIndex(index)
                      setIsMusicPlaying(true)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                      index === currentChannelIndex
                        ? 'border-accent/50 bg-accent/15 text-foreground shadow-[0_0_12px_rgba(var(--accent)/0.2)]'
                        : 'border-foreground/10 bg-secondary/30 text-foreground/80 hover:border-foreground/20 hover:bg-secondary/50'
                    }`}
                  >
                    <span className="truncate">{t.music.channels[ch.key]}</span>
                    {index === currentChannelIndex && isMusicPlaying ? (
                      <span className="ml-2 shrink-0 text-[10px] text-accent">{t.music.live}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
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
            
            {favoriteChannels.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic">{t.music.noFavorites}</p>
            ) : (
              <div className="space-y-1">
                {favoriteChannels.map((key) => (
                  <div
                    key={key}
                    className="group flex items-center justify-between rounded-lg border border-foreground/10 bg-secondary/30 px-2 py-1.5 transition-all hover:border-foreground/20 hover:bg-secondary/50"
                  >
                    <button
                      onClick={() => handlePlayFavorite(key)}
                      className="flex-1 text-left text-xs text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {t.music.channels[key]}
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(key)}
                      className="ml-2 flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all hover:bg-red-500/20 group-hover:opacity-100"
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
                className="flex h-6 w-6 items-center justify-center rounded-md border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-accent/50 hover:bg-accent/20 hover:text-accent hover:shadow-[0_0_10px_rgba(var(--accent)/0.3)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            
            {/* Scene Name Input */}
            {showSceneInput && (
              <div className="glass animate-fade-in-up space-y-2 rounded-lg border border-accent/40 bg-popover/60 p-2 shadow-[0_0_20px_rgba(var(--accent)/0.2)]">
                <input
                  type="text"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  placeholder={t.myScenes.namePlaceholder}
                  className="glass w-full rounded-md border border-foreground/20 bg-input/30 px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-accent/50 focus:outline-none focus:shadow-[0_0_10px_rgba(var(--accent)/0.3)]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveScene()
                    if (e.key === 'Escape') setShowSceneInput(false)
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSceneInput(false)}
                    className="flex-1 rounded-md border border-foreground/10 bg-secondary/50 px-2 py-1 text-xs text-foreground/70 transition-all hover:bg-secondary"
                  >
                    {t.myScenes.cancel}
                  </button>
                  <button
                    onClick={handleSaveScene}
                    disabled={!newSceneName.trim()}
                    className="flex-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-[0_0_12px_rgba(var(--accent)/0.4)] disabled:opacity-50"
                  >
                    {t.myScenes.confirm}
                  </button>
                </div>
              </div>
            )}
            
            {/* Saved Scenes List */}
            {savedWorlds.length === 0 && !showSceneInput ? (
              <p className="text-xs text-muted-foreground/60 italic">
                {isAuthenticated ? t.myScenes.noScenes : t.myScenes.loginRequired}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {savedWorlds.map((world, index) => (
                  <div
                    key={world.id}
                    className={`glass group animate-fade-in-up relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all duration-300 hover:border-accent/40 hover:bg-accent/15 hover:shadow-[0_0_12px_rgba(var(--accent)/0.25)] ${
                      world.id === activeWorldId
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-foreground/15 bg-popover/50'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <button
                      onClick={() => handleLoadScene(world)}
                      className="max-w-[140px] truncate text-xs text-foreground/80 transition-colors hover:text-foreground"
                      title={world.title}
                    >
                      {world.title}
                    </button>
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
              {!userProfile?.isVip && !preferCreditPack ? (
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
              {!userProfile?.isVip ? (
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
