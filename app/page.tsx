'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { Menu, ImageIcon, Volume2 } from 'lucide-react'
import { AmbientWorld } from '@/components/ui/ambient-world'
import ControlPanel from '@/components/control-panel'
import GoogleSignInButton from '@/components/google-sign-in-button'
import CommunityGallery from '@/components/community-gallery'
import StreamAudioPlayer from '@/components/stream-audio-player'
import { LanguageProvider, useLanguage } from '@/lib/language-context'
import { SCENE_DATA, type SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import { MUSIC_CHANNELS as STREAM_MUSIC_CHANNELS, type MusicChannelKey } from '@/lib/music-channels'
import { AMBIENT_WORLDS, WORLD_MUSIC_CHANNELS } from '@/lib/worlds'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { signInWithGoogle } from '@/lib/auth-google'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import {
  deleteWorld,
  fetchUserProfile,
  fetchWorlds,
  startCheckout,
  updateWorldTitle,
  type UserAccountProfile,
} from '@/lib/api-client'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

type VideoBackgroundRef = {
  play: () => void
  pause: () => void
  toggleMute: () => void
}

const channelKeys = STREAM_MUSIC_CHANNELS.map((channel) => channel.key)

const AMBIENCE_AUDIO_SOURCES: Record<string, string> = {
  'neon-rain-ambience': '/ambience/neon-rain.mp3',
  'cosmic-low-hum': '/ambience/cosmic-low-hum.mp3',
  'deep-ocean-drone': '/ambience/deep-ocean-drone.mp3',
}

const AMBIENCE_VOLUME_RATIO = 0.28

type GalleryWorldAssets = {
  backgroundImage: string
  depthMap: string
  /** Scene key from generate API, used to resolve particle/shader presets. */
  particlePreset?: string
}

type AmbientWorldLayer = GalleryWorldAssets & {
  key: string
  particlePreset: string
  shaderPreset: string
  ambienceAudio: string
  isActive: boolean
}

type UserGeneratedWorld = {
  id: string
  title: string
  backgroundImage: string
  depthMap: string
  particlePreset: string
}

type GenerateApiResponse =
  | { success: true; world: UserGeneratedWorld }
  | { success: false; error: string }

const SCENE_TO_PARTICLE_PRESET: Record<string, string> = {
  cyberpunk: 'cyberpunk',
  nature: 'cosmic-dust',
  space: 'cosmic-dust',
  ocean: 'underwater-mist',
  city: 'cyberpunk',
  desert: 'cosmic-dust',
}

const SCENE_TO_WORLD_ID: Record<string, string> = {
  cyberpunk: 'cyberpunk',
  nature: 'cosmic-dust',
  space: 'cosmic-dust',
  ocean: 'deep-ocean',
  city: 'cyberpunk',
  desert: 'deep-ocean',
}

function resolvePresetWorld(worldId: string, sceneKey?: string) {
  const presetById = AMBIENT_WORLDS.find((world) => world.id === worldId)
  if (presetById) return presetById

  const mappedWorldId = sceneKey ? SCENE_TO_WORLD_ID[sceneKey] : undefined
  if (mappedWorldId) {
    const presetByScene = AMBIENT_WORLDS.find((world) => world.id === mappedWorldId)
    if (presetByScene) return presetByScene
  }

  return AMBIENT_WORLDS[0]
}

function resolveParticlePreset(sceneKey: string | undefined, fallback: string) {
  if (!sceneKey) return fallback
  return SCENE_TO_PARTICLE_PRESET[sceneKey] ?? sceneKey ?? fallback
}

function GeneratingOverlay() {
  const { t } = useLanguage()

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-background/50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm font-medium text-foreground/90">{t.generating}</p>
      </div>
    </div>
  )
}

export default function TimeLoopPage() {
  const videoRef = useRef<VideoBackgroundRef>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(false)
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false)
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)
  const [musicChannelIndex, setMusicChannelIndex] = useState(0)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false)
  const [musicVolume, setMusicVolume] = useState(70)
  const [currentWorldId, setCurrentWorldId] = useState('cyberpunk')
  const [currentGalleryAssets, setCurrentGalleryAssets] = useState<GalleryWorldAssets | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserAccountProfile | null>(null)
  const [savedWorlds, setSavedWorlds] = useState<PublicGeneratedWorld[]>([])
  const [activeWorldId, setActiveWorldId] = useState<string | null>(null)
  const [regionPreference, setRegionPreference] = useState<'global' | 'cn' | null>(null)
  const [isCnHost, setIsCnHost] = useState(false)
  const [showRegionPrompt, setShowRegionPrompt] = useState(false)
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient()
    } catch (error) {
      console.warn('[auth] Supabase client unavailable:', error)
      return null
    }
  }, [])
  const presetWorld = resolvePresetWorld(currentWorldId, currentGalleryAssets?.particlePreset)
  // Use gallery/generated assets as-is (supports https:// absolute URLs and local /gallery/ paths).
  const activeBackgroundImage = currentGalleryAssets?.backgroundImage ?? presetWorld.backgroundImage
  const activeDepthMap = currentGalleryAssets?.depthMap ?? presetWorld.depthMap
  const activeParticlePreset = resolveParticlePreset(
    currentGalleryAssets?.particlePreset,
    presetWorld.particlePreset,
  )
  const activeShaderPreset = presetWorld.shaderPreset
  const activeAmbienceAudio = presetWorld.ambienceAudio
  const activeMusicChannel = STREAM_MUSIC_CHANNELS[musicChannelIndex] ?? STREAM_MUSIC_CHANNELS[0]
  const activeMusicStreamUrl = useMemo(() => {
    if (!activeMusicChannel) return ''
    if (regionPreference === 'cn' || isCnHost) {
      return `/api/stream?station=${encodeURIComponent(activeMusicChannel.key)}`
    }
    return activeMusicChannel.streamUrl
  }, [activeMusicChannel, isCnHost, regionPreference])
  const activeAmbienceUrl = AMBIENCE_AUDIO_SOURCES[activeAmbienceAudio] ?? ''
  const ambienceVolume = Math.round(musicVolume * AMBIENCE_VOLUME_RATIO)
  const activeAmbientLayer = useMemo<AmbientWorldLayer>(
    () => ({
      key: [
        currentWorldId,
        activeBackgroundImage,
        activeDepthMap,
        activeParticlePreset,
        activeShaderPreset,
      ].join(':'),
      backgroundImage: activeBackgroundImage,
      depthMap: activeDepthMap,
      particlePreset: activeParticlePreset,
      shaderPreset: activeShaderPreset,
      ambienceAudio: activeAmbienceAudio,
      isActive: true,
    }),
    [
      currentWorldId,
      activeBackgroundImage,
      activeDepthMap,
      activeParticlePreset,
      activeShaderPreset,
      activeAmbienceAudio,
    ],
  )
  const [ambientLayers, setAmbientLayers] = useState<AmbientWorldLayer[]>(() => [activeAmbientLayer])

  const handleMusicChannelIndexChange = useCallback((index: number) => {
    setMusicChannelIndex(index)
  }, [])

  const handleMusicPlayingChange = useCallback((playing: boolean) => {
    if (playing) setIsAudioUnlocked(true)
    setIsMusicPlaying(playing)
  }, [])

  const handleUnlockAudio = useCallback(() => {
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
  }, [])

  const preferCreditPack = regionPreference === 'cn' || isCnHost

  const refreshAccountData = useCallback(async () => {
    if (!supabase) return

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setUserProfile(null)
      setSavedWorlds([])
      return
    }

    const [profile, worlds] = await Promise.all([
      fetchUserProfile(accessToken),
      fetchWorlds(accessToken),
    ])
    setUserProfile(profile)
    setSavedWorlds(worlds.own)
  }, [supabase])

  useEffect(() => {
    if (!authUser) {
      setUserProfile(null)
      setSavedWorlds([])
      return
    }
    void refreshAccountData()
  }, [authUser, refreshAccountData])

  useEffect(() => {
    if (!supabase) return

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthUser(data.session?.user ?? null)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    const hostname = window.location.hostname
    const currentIsCnHost = hostname === 'cn.localhost' || hostname.startsWith('cn.')
    setIsCnHost(currentIsCnHost)

    const storedPreference = localStorage.getItem('timeloop-region')
    if (storedPreference === 'global' || storedPreference === 'cn') {
      setRegionPreference(storedPreference)
      return
    }

    const language = navigator.language.toLowerCase()
    if (!currentIsCnHost && language === 'zh-cn') {
      setShowRegionPrompt(true)
    }
  }, [])

  const chooseRegion = useCallback((region: 'global' | 'cn') => {
    localStorage.setItem('timeloop-region', region)
    setRegionPreference(region)
    setShowRegionPrompt(false)

    if (region === 'cn') {
      const cnSiteUrl = process.env.NEXT_PUBLIC_CN_SITE_URL
      if (cnSiteUrl && !window.location.hostname.startsWith('cn.')) {
        window.location.href = cnSiteUrl
      }
    }
  }, [])

  const handleRequireAuth = useCallback(async () => {
    if (authUser) return true
    if (!supabase) {
      window.alert('Supabase 尚未設定，請先補上 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY。')
      return false
    }

    const { error } = await signInWithGoogle(supabase)

    if (error) {
      window.alert(error.message)
      return false
    }

    return false
  }, [authUser, supabase])

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null
    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token ?? null
  }, [supabase])

  const handleLoadWorld = useCallback((world: PublicGeneratedWorld) => {
    setActiveWorldId(world.id)
    setCurrentWorldId(world.id)
    setCurrentGalleryAssets({
      backgroundImage: world.backgroundImage,
      depthMap: world.depthMap,
      particlePreset: world.particlePreset,
    })
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
    setLeftPanelExpanded(false)
    setLeftDrawerOpen(false)
  }, [])

  const handleDeleteWorld = useCallback(async (worldId: string) => {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      await handleRequireAuth()
      return
    }

    try {
      await deleteWorld(accessToken, worldId)
      setSavedWorlds((worlds) => worlds.filter((world) => world.id !== worldId))
      if (activeWorldId === worldId) {
        setActiveWorldId(null)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed'
      window.alert(message)
    }
  }, [activeWorldId, getAccessToken, handleRequireAuth])

  const handleRenameWorld = useCallback(async (worldId: string, title: string) => {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      await handleRequireAuth()
      return
    }

    try {
      await updateWorldTitle(accessToken, worldId, title)
      setSavedWorlds((worlds) =>
        worlds.map((world) => (world.id === worldId ? { ...world, title } : world)),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rename failed'
      window.alert(message)
    }
  }, [getAccessToken, handleRequireAuth])

  const handleCheckout = useCallback(async (kind: 'subscription' | 'credits') => {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      await handleRequireAuth()
      return
    }

    try {
      const checkoutUrl = await startCheckout(accessToken, kind)
      if (checkoutUrl) window.location.href = checkoutUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed'
      window.alert(message)
    }
  }, [getAccessToken, handleRequireAuth])

  const handleDownload = useCallback(async () => {
    if (!userProfile?.isVip) {
      window.alert('下載功能僅限 VIP 會員使用，請先升級。')
      return
    }

    const imageUrl = activeBackgroundImage
    if (!imageUrl) return

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `timeloop-${activeWorldId ?? currentWorldId}.jpg`
      anchor.click()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('[download]', error)
      window.alert('下載失敗，請稍後再試。')
    }
  }, [activeBackgroundImage, activeWorldId, currentWorldId, userProfile?.isVip])

  useEffect(() => {
    setAmbientLayers((layers) => {
      if (layers.some((layer) => layer.key === activeAmbientLayer.key && layer.isActive)) {
        return layers
      }

      const exitingLayers = layers.map((layer) => ({ ...layer, isActive: false }))
      return [...exitingLayers.slice(-1), activeAmbientLayer]
    })

    const cleanupTimer = window.setTimeout(() => {
      setAmbientLayers((layers) => layers.filter((layer) => layer.key === activeAmbientLayer.key))
    }, 1100)

    return () => window.clearTimeout(cleanupTimer)
  }, [activeAmbientLayer])

  const handleEnterGalleryScene = useCallback((item: GallerySceneItem) => {
    const nextWorldId = item.worldId
    const backgroundImage = `/gallery/backgrounds/${item.id}-bg.jpg`
    const depthMap = `/gallery/depths/${item.id}-depth.jpg`
    const nextChannelKey = WORLD_MUSIC_CHANNELS[nextWorldId] ?? item.stationHints[0]
    const nextChannelIndex = channelKeys.indexOf(nextChannelKey)

    setActiveWorldId(null)
    setCurrentWorldId(nextWorldId)
    setCurrentGalleryAssets({ backgroundImage, depthMap })
    setIsAudioUnlocked(true)
    if (nextChannelIndex !== -1) {
      setMusicChannelIndex(nextChannelIndex)
      setIsMusicPlaying(true)
    }
    setRightPanelExpanded(false)
  }, [])

  const handleGenerate = useCallback(async (prompt: string, scene: string) => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return
    if (!authUser) {
      await handleRequireAuth()
      return
    }
    if (!supabase) {
      window.alert('Supabase 尚未設定，無法使用 AI 生成。')
      return
    }

    setIsGenerating(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        await handleRequireAuth()
        return
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          particlePreset: scene,
        }),
      })

      const res = (await response.json()) as GenerateApiResponse

      if (!response.ok || !res.success) {
        const message = res.success ? 'Generation failed' : res.error
        console.error('[handleGenerate]', message)
        window.alert(message)
        return
      }

      setCurrentWorldId(res.world.id)
      setActiveWorldId(res.world.id)
      setCurrentGalleryAssets({
        backgroundImage: res.world.backgroundImage,
        depthMap: res.world.depthMap,
        particlePreset: res.world.particlePreset,
      })
      setIsAudioUnlocked(true)
      setIsMusicPlaying(true)
      setLeftPanelExpanded(false)
      setLeftDrawerOpen(false)
      void refreshAccountData()
    } catch (error) {
      console.error('[handleGenerate] Unexpected error:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [authUser, handleRequireAuth, supabase])

  // Track mouse position to show/hide panels
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth
      const mouseX = e.clientX
      const leftThreshold = windowWidth / 3
      const rightThreshold = (windowWidth * 2) / 3

      if (mouseX < leftThreshold) {
        // Mouse in left 1/3
        setLeftPanelExpanded(true)
        setRightPanelExpanded(false)
      } else if (mouseX > rightThreshold) {
        // Mouse in right 1/3
        setRightPanelExpanded(true)
        setLeftPanelExpanded(false)
      }
      // Middle area: panels will auto-hide via their own 3-second timers
    }

    // Only add listener on desktop
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    if (mediaQuery.matches) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        window.addEventListener('mousemove', handleMouseMove)
      } else {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }

    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  return (
    <LanguageProvider>
      <main className="relative h-screen w-screen overflow-hidden bg-background">
        {/* Full screen ambient world background with true crossfade */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-transparent">
          {ambientLayers.map((layer) => (
            <div
              key={layer.key}
              className={`absolute inset-0 bg-transparent transition-opacity duration-1000 ease-in-out ${
                layer.isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <AmbientWorld
                backgroundImage={layer.backgroundImage}
                depthMap={layer.depthMap}
                particles={layer.particlePreset}
                shader={layer.shaderPreset}
                ambience={layer.ambienceAudio}
              />
            </div>
          ))}
        </div>

        <StreamAudioPlayer
          streamUrl={activeMusicStreamUrl}
          playing={isMusicPlaying}
          volume={musicVolume}
          muted={!isAudioUnlocked}
        />
        <StreamAudioPlayer
          streamUrl={activeAmbienceUrl}
          playing={isMusicPlaying}
          volume={ambienceVolume}
          muted={!isAudioUnlocked}
          loop
        />

        {!isAudioUnlocked ? (
          <button
            type="button"
            onClick={handleUnlockAudio}
            className="glass pointer-events-auto fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-popover/75 px-4 py-2 text-sm font-medium text-foreground shadow-[0_0_24px_rgba(80,180,255,0.25)] backdrop-blur-md transition hover:border-accent/70 hover:bg-popover/90"
            aria-label="開啟聲音"
          >
            <Volume2 className="h-4 w-4 text-accent" />
            開啟聲音
          </button>
        ) : null}

        {showRegionPrompt ? (
          <div className="fixed inset-x-4 top-20 z-[95] mx-auto max-w-md rounded-2xl border border-accent/30 bg-popover/90 p-4 text-sm text-foreground shadow-[0_0_32px_rgba(80,180,255,0.22)] backdrop-blur-md">
            <p className="font-medium">偵測到你可能使用簡體中文環境</p>
            <p className="mt-1 text-muted-foreground">
              是否切換到中國優化入口？系統會記住你的選擇，不會每次詢問。
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => chooseRegion('global')}
                className="flex-1 rounded-lg border border-foreground/10 bg-secondary/60 px-3 py-2 text-foreground/80 transition hover:bg-secondary"
              >
                留在國際站
              </button>
              <button
                type="button"
                onClick={() => chooseRegion('cn')}
                className="flex-1 rounded-lg bg-accent px-3 py-2 font-medium text-accent-foreground transition hover:bg-accent/90"
              >
                切換中國入口
              </button>
            </div>
          </div>
        ) : null}

        {/* Desktop: Hidden side panels */}
        <ControlPanel
          videoRef={videoRef}
          onGenerate={handleGenerate}
          isAuthenticated={Boolean(authUser)}
          onRequireAuth={handleRequireAuth}
          isGenerating={isGenerating}
          isExpanded={leftPanelExpanded}
          onExpandedChange={setLeftPanelExpanded}
          musicChannelIndex={musicChannelIndex}
          onMusicChannelIndexChange={handleMusicChannelIndexChange}
          isMusicPlaying={isMusicPlaying}
          onMusicPlayingChange={handleMusicPlayingChange}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          userProfile={userProfile}
          savedWorlds={savedWorlds}
          activeWorldId={activeWorldId}
          onLoadWorld={handleLoadWorld}
          onDeleteWorld={handleDeleteWorld}
          onRenameWorld={handleRenameWorld}
          onCheckout={handleCheckout}
          onDownload={handleDownload}
          preferCreditPack={preferCreditPack}
        />

        <CommunityGallery
          isExpanded={rightPanelExpanded}
          onExpandedChange={setRightPanelExpanded}
          onEnterScene={handleEnterGalleryScene}
        />

        {/* Mobile: Corner icons with drawer support */}
        <div className="pointer-events-auto fixed left-4 top-4 z-[80] md:hidden">
          <Drawer open={leftDrawerOpen} onOpenChange={setLeftDrawerOpen} direction="left">
            <DrawerTrigger asChild>
              <button
                type="button"
                onClick={() => setLeftDrawerOpen(true)}
                className="glass flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-foreground/10 bg-popover/50 text-foreground/70 transition-all hover:bg-popover/70 hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="glass h-full w-[85%] max-w-[320px] bg-popover/90">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Control Panel</DrawerTitle>
              </DrawerHeader>
              <MobileControlContent
                videoRef={videoRef}
                onGenerate={handleGenerate}
                isAuthenticated={Boolean(authUser)}
                onRequireAuth={handleRequireAuth}
                isGenerating={isGenerating}
                onClose={() => setLeftDrawerOpen(false)}
                musicChannelIndex={musicChannelIndex}
                onMusicChannelIndexChange={handleMusicChannelIndexChange}
                isMusicPlaying={isMusicPlaying}
                onMusicPlayingChange={handleMusicPlayingChange}
                musicVolume={musicVolume}
                onMusicVolumeChange={setMusicVolume}
                userProfile={userProfile}
                savedWorlds={savedWorlds}
                activeWorldId={activeWorldId}
                onLoadWorld={handleLoadWorld}
                onDeleteWorld={handleDeleteWorld}
                onRenameWorld={handleRenameWorld}
                onCheckout={handleCheckout}
                onDownload={handleDownload}
                preferCreditPack={preferCreditPack}
              />
            </DrawerContent>
          </Drawer>
        </div>

        <div className="pointer-events-auto fixed right-4 top-4 z-[80] md:hidden">
          <Drawer open={rightDrawerOpen} onOpenChange={setRightDrawerOpen} direction="right">
            <DrawerTrigger asChild>
              <button
                type="button"
                onClick={() => setRightDrawerOpen(true)}
                className="glass flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-foreground/10 bg-popover/50 text-foreground/70 transition-all hover:bg-popover/70 hover:text-foreground"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="glass h-full w-[85%] max-w-[320px] bg-popover/90">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Community Gallery</DrawerTitle>
              </DrawerHeader>
              <MobileGalleryContent
                onClose={() => setRightDrawerOpen(false)}
                onEnterScene={handleEnterGalleryScene}
              />
            </DrawerContent>
          </Drawer>
        </div>

        {isGenerating ? <GeneratingOverlay /> : null}
      </main>
    </LanguageProvider>
  )
}

// Mobile Control Panel Content
import {
  Play,
  Pause,
  VolumeX,
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
  ShoppingCart,
} from 'lucide-react'
import LanguageSelector from '@/components/language-selector'

interface MobileControlContentProps {
  videoRef: React.RefObject<VideoBackgroundRef | null>
  onGenerate: (prompt: string, scene: string) => void
  isAuthenticated: boolean
  onRequireAuth: () => void | Promise<boolean>
  isGenerating: boolean
  onClose: () => void
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

function MobileControlContent({
  videoRef,
  onGenerate,
  isAuthenticated,
  onRequireAuth,
  isGenerating,
  onClose,
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
}: MobileControlContentProps) {
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
  const { t } = useLanguage()

  const scenes: SceneKey[] = ['cyberpunk', 'nature', 'space', 'ocean', 'city', 'desert']
  const currentChannel = STREAM_MUSIC_CHANNELS[currentChannelIndex] ?? STREAM_MUSIC_CHANNELS[0]
  const isCurrentFavorited = favoriteChannels.includes(currentChannel.key)

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('musicFavorites')
    if (savedFavorites) {
      try {
        setFavoriteChannels(JSON.parse(savedFavorites))
      } catch { /* ignore */ }
    }
  }, [])

  // Music handlers
  const handleMusicToggle = () => setIsMusicPlaying(!isMusicPlaying)
  const handlePrevChannel = () => {
    setCurrentChannelIndex(currentChannelIndex === 0 ? STREAM_MUSIC_CHANNELS.length - 1 : currentChannelIndex - 1)
  }
  const handleNextChannel = () => {
    setCurrentChannelIndex((currentChannelIndex + 1) % STREAM_MUSIC_CHANNELS.length)
  }

  // Favorite handlers
  const handleToggleFavorite = () => {
    if (isCurrentFavorited) {
      const newFavorites = favoriteChannels.filter(key => key !== currentChannel.key)
      setFavoriteChannels(newFavorites)
      localStorage.setItem('musicFavorites', JSON.stringify(newFavorites))
    } else {
      const newFavorites = [...favoriteChannels, currentChannel.key]
      setFavoriteChannels(newFavorites)
      localStorage.setItem('musicFavorites', JSON.stringify(newFavorites))
      setShowFavoriteToast(true)
      setTimeout(() => setShowFavoriteToast(false), 2000)
    }
  }

  const handleRemoveFavorite = (key: MusicChannelKey) => {
    const newFavorites = favoriteChannels.filter(k => k !== key)
    setFavoriteChannels(newFavorites)
    localStorage.setItem('musicFavorites', JSON.stringify(newFavorites))
  }

  const handlePlayFavorite = (key: MusicChannelKey) => {
    const index = STREAM_MUSIC_CHANNELS.findIndex(ch => ch.key === key)
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

  // Fullscreen toggle handler
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

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
    if (!prompt.trim()) return
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }
    onGenerate(prompt, selectedScene)
  }

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
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
          className="glass h-24 w-full resize-none rounded-lg border border-foreground/10 bg-input/50 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-accent/50 focus:outline-none"
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
            onClick={handlePlayPause}
            icon={isPaused ? Play : Pause}
            label={isPaused ? t.controls.play : t.controls.pause}
          />
          <MobileControlButton
            onClick={handleMuteToggle}
            icon={isMuted ? VolumeX : Volume2}
            label={isMuted ? t.controls.unmute : t.controls.mute}
          />
          <MobileControlButton
            onClick={onDownload}
            icon={Download}
            label={t.controls.download}
          />
          <MobileControlButton
            onClick={() => {}}
            icon={Settings}
            label={t.controls.settings}
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
          <button
            onClick={handlePrevChannel}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-foreground/10 bg-secondary/30 px-3 py-2">
            <span className="truncate text-xs font-medium text-foreground">
              {t.music.channels[currentChannel.key]}
            </span>
          </div>
          
          <button
            onClick={handleNextChannel}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/50 text-foreground/70 transition-all hover:border-foreground/20 hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleMusicToggle}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
              isMusicPlaying 
                ? 'border-accent/50 bg-accent/20 text-accent' 
                : 'border-foreground/10 bg-secondary/50 text-foreground/70 hover:border-foreground/20 hover:bg-secondary hover:text-foreground'
            }`}
          >
            {isMusicPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <button
            onClick={handleToggleFavorite}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300 ${
              isCurrentFavorited 
                ? 'border-red-500/60 bg-red-500/25 text-red-500 shadow-[0_0_16px_rgba(239,68,68,0.7),0_0_32px_rgba(239,68,68,0.4)]' 
                : 'border-foreground/10 bg-secondary/50 text-foreground/70 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105'
            }`}
          >
            <Heart className={`h-4 w-4 transition-all duration-300 ${isCurrentFavorited ? 'fill-current scale-110 heart-glow-active' : ''}`} />
          </button>
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
                className="group flex items-center justify-between rounded-lg border border-foreground/10 bg-secondary/30 px-3 py-2 transition-all hover:border-foreground/20 hover:bg-secondary/50"
              >
                <button
                  onClick={() => handlePlayFavorite(key)}
                  className="flex-1 text-left text-xs text-foreground/80 transition-colors hover:text-foreground"
                >
                  {t.music.channels[key]}
                </button>
                <button
                  onClick={() => handleRemoveFavorite(key)}
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

// Mobile Gallery Content
interface MobileGalleryContentProps {
  onClose: () => void
  onEnterScene: (item: GallerySceneItem) => void
}

// Mock NFT data - 3x7 grid (21 items) - same as community-gallery
type MobileNFTRarity = 'legendary' | 'rare' | 'common'
const mobileNftItems: { id: string; thumbnail: string; price: string; rarity: MobileNFTRarity }[] = [
  { id: '001', thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=150&h=150&fit=crop', price: '0.5', rarity: 'legendary' },
  { id: '002', thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop', price: '0.8', rarity: 'rare' },
  { id: '003', thumbnail: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&h=150&fit=crop', price: '1.2', rarity: 'legendary' },
  { id: '004', thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=150&h=150&fit=crop', price: '0.6', rarity: 'common' },
  { id: '005', thumbnail: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=150&h=150&fit=crop', price: '0.9', rarity: 'rare' },
  { id: '006', thumbnail: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=150&h=150&fit=crop', price: '0.7', rarity: 'common' },
  { id: '007', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=150&h=150&fit=crop', price: '1.5', rarity: 'legendary' },
  { id: '008', thumbnail: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=150&h=150&fit=crop', price: '0.4', rarity: 'common' },
  { id: '009', thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&h=150&fit=crop', price: '2.1', rarity: 'legendary' },
  { id: '010', thumbnail: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=150&h=150&fit=crop', price: '0.3', rarity: 'common' },
  { id: '011', thumbnail: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=150&h=150&fit=crop', price: '1.8', rarity: 'rare' },
  { id: '012', thumbnail: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=150&h=150&fit=crop', price: '0.5', rarity: 'common' },
  { id: '013', thumbnail: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=150&h=150&fit=crop', price: '3.2', rarity: 'legendary' },
  { id: '014', thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop', price: '0.9', rarity: 'rare' },
  { id: '015', thumbnail: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=150&h=150&fit=crop', price: '0.4', rarity: 'common' },
  { id: '016', thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&h=150&fit=crop', price: '1.1', rarity: 'rare' },
  { id: '017', thumbnail: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=150&h=150&fit=crop', price: '0.6', rarity: 'common' },
  { id: '018', thumbnail: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=150&h=150&fit=crop', price: '2.5', rarity: 'legendary' },
  { id: '019', thumbnail: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=150&h=150&fit=crop', price: '0.7', rarity: 'rare' },
  { id: '020', thumbnail: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=150&h=150&fit=crop', price: '0.3', rarity: 'common' },
  { id: '021', thumbnail: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=150&h=150&fit=crop', price: '1.9', rarity: 'legendary' },
]

const mobileRarityBorders: Record<MobileNFTRarity, string> = {
  legendary: 'ring-1 ring-amber-500/50',
  rare: 'ring-1 ring-purple-500/50',
  common: 'ring-1 ring-foreground/10',
}

function MobileGalleryContent({ onClose, onEnterScene }: MobileGalleryContentProps) {
  const { t } = useLanguage()

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <ImageIcon className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.gallery.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* NFT Grid - 3x7 */}
      <div className="grid grid-cols-3 gap-1.5">
        {SCENE_DATA.map((item, index) => {
          const rarity = mobileNftItems[index]?.rarity ?? 'common'

          return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onEnterScene(item)
              onClose()
            }}
            className={`group relative aspect-square cursor-pointer overflow-hidden rounded-md ${mobileRarityBorders[rarity]} transition-all duration-200 hover:scale-105 hover:ring-2`}
          >
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
              loading="lazy"
            />
            <div className="absolute left-0.5 top-0.5 rounded-sm bg-black/60 px-1 py-px text-[8px] font-mono text-white/90">
              #{String(index + 1).padStart(3, '0')}
            </div>
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="mb-1 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
                <span className="text-[8px] font-medium text-accent">{item.price} ETH</span>
                <ShoppingCart className="h-2.5 w-2.5 text-white/80" />
              </div>
            </div>
          </button>
          )
        })}
      </div>

      {/* Advertisement Placeholder */}
      <div className="mt-3">
        <div className="glass flex h-[100px] w-full items-center justify-center rounded-lg border border-foreground/10 bg-popover/40">
          <span className="text-xs text-muted-foreground/50">Sponsored Content</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-foreground/10 pt-3 text-center text-xs text-muted-foreground">
        <p>{t.gallery.trending}</p>
      </div>
    </div>
  )
}


