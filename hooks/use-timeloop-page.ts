'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { requestAppFullscreen, requestLandscapeOrientation } from '@/lib/fullscreen'
import { useIsMobile } from '@/hooks/use-mobile'
import { useOrientation } from '@/hooks/use-orientation'
import { type SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import { useMusicStation } from '@/hooks/use-music-station'
import type { MusicMoodId } from '@/lib/music-moods'
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
import type { VideoBackgroundRef } from '@/components/ui/video-background'
import {
  AMBIENCE_AUDIO_SOURCES,
  AMBIENCE_VOLUME_RATIO,
  MOBILE_GESTURE_SESSION_KEY,
} from '@/lib/timeloop/constants'
import type { AmbientWorldLayer, GalleryWorldAssets, GenerateApiResponse } from '@/lib/timeloop/types'
import { resolveParticlePreset, resolvePresetWorld } from '@/lib/timeloop/world-resolver'
import { buildStreamPlaybackUrl } from '@/lib/radio-station'
import { primeStreamAudio } from '@/lib/prime-stream-audio'

export function useTimeloopPage() {
  const music = useMusicStation()
  const videoRef = useRef<VideoBackgroundRef>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(false)
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false)
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)
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
  const [hasUserGestured, setHasUserGestured] = useState(false)
  const isMobile = useIsMobile()
  const { isLandscape } = useOrientation()
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient()
    } catch (error) {
      console.warn('[auth] Supabase client unavailable:', error)
      return null
    }
  }, [])
  const presetWorld = resolvePresetWorld(currentWorldId, currentGalleryAssets?.particlePreset)
  const activeBackgroundImage = currentGalleryAssets?.backgroundImage ?? presetWorld.backgroundImage
  const activeDepthMap = currentGalleryAssets?.depthMap ?? presetWorld.depthMap
  const activeParticlePreset = resolveParticlePreset(
    currentGalleryAssets?.particlePreset,
    presetWorld.particlePreset,
  )
  const activeShaderPreset = presetWorld.shaderPreset
  const activeAmbienceAudio = presetWorld.ambienceAudio
  const activeMusicStreamUrl = music.activeMusicStreamUrl
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

  const handleMusicPlayingChange = useCallback((playing: boolean) => {
    if (playing) setIsAudioUnlocked(true)
    setIsMusicPlaying(playing)
  }, [])

  const handleUnlockAudio = useCallback(() => {
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
    if (music.activeMusicStreamUrl) {
      primeStreamAudio(music.activeMusicStreamUrl, musicVolume)
    }
  }, [music.activeMusicStreamUrl, musicVolume])

  const handleMobileGateTap = useCallback(() => {
    void requestAppFullscreen()
    void requestLandscapeOrientation()
    sessionStorage.setItem(MOBILE_GESTURE_SESSION_KEY, '1')
    setHasUserGestured(true)
    if (music.musicOnboarded && music.activeMusicStreamUrl) {
      setIsAudioUnlocked(true)
      setIsMusicPlaying(true)
      primeStreamAudio(music.activeMusicStreamUrl, musicVolume)
    }
  }, [music.activeMusicStreamUrl, music.musicOnboarded, musicVolume])

  const showMobileGate = isMobile && (!hasUserGestured || !isLandscape)
  const pastMobileGate = !isMobile || (hasUserGestured && isLandscape)
  const showMusicOnboarding = pastMobileGate && !music.musicOnboarded
  const showCockpit = pastMobileGate && music.musicOnboarded
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
    if (sessionStorage.getItem(MOBILE_GESTURE_SESSION_KEY) === '1') {
      setHasUserGestured(true)
    }
  }, [])

  useEffect(() => {
    if (isMobile && hasUserGestured && isLandscape && !isAudioUnlocked) {
      setIsAudioUnlocked(true)
      setIsMusicPlaying(true)
    }
  }, [isMobile, hasUserGestured, isLandscape, isAudioUnlocked])

  // Always start music once onboarded and a station is ready
  useEffect(() => {
    if (!pastMobileGate || !music.musicOnboarded || !music.currentStation) return
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
  }, [pastMobileGate, music.musicOnboarded, music.currentStation])

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
    void requestAppFullscreen()
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

  const handleDeleteWorld = useCallback(
    async (worldId: string) => {
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
    },
    [activeWorldId, getAccessToken, handleRequireAuth],
  )

  const handleRenameWorld = useCallback(
    async (worldId: string, title: string) => {
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
    },
    [getAccessToken, handleRequireAuth],
  )

  const handleCheckout = useCallback(
    async (kind: 'subscription' | 'credits') => {
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
    },
    [getAccessToken, handleRequireAuth],
  )

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

  const handleCompleteMusicOnboarding = useCallback(
    (moods: MusicMoodId[]) => {
      const initial = music.completeMusicOnboarding(moods)
      setIsAudioUnlocked(true)
      setIsMusicPlaying(true)
      primeStreamAudio(buildStreamPlaybackUrl(initial), musicVolume)
    },
    [music, musicVolume],
  )

  const handleEnterGalleryScene = useCallback(
    (item: GallerySceneItem) => {
      const nextWorldId = item.worldId
      const backgroundImage = `/gallery/backgrounds/${item.id}-bg.jpg`
      const depthMap = `/gallery/depths/${item.id}-depth.jpg`

      setActiveWorldId(null)
      setCurrentWorldId(nextWorldId)
      setCurrentGalleryAssets({ backgroundImage, depthMap })
      setIsAudioUnlocked(true)
      music.loadStationForWorld(nextWorldId)
      setIsMusicPlaying(true)
      setRightPanelExpanded(false)
    },
    [music],
  )

  const handleGenerate = useCallback(
    async (prompt: string, scene: string) => {
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

        let res: GenerateApiResponse
        try {
          res = (await response.json()) as GenerateApiResponse
        } catch {
          window.alert(`生圖請求失敗（HTTP ${response.status}）。請確認 Cloudflare Workers Paid 已啟用。`)
          return
        }

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
    },
    [authUser, handleRequireAuth, refreshAccountData, supabase],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth
      const mouseX = e.clientX
      const leftThreshold = windowWidth / 3
      const rightThreshold = (windowWidth * 2) / 3

      if (mouseX < leftThreshold) {
        setLeftPanelExpanded(true)
        setRightPanelExpanded(false)
      } else if (mouseX > rightThreshold) {
        setRightPanelExpanded(true)
        setLeftPanelExpanded(false)
      }
    }

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

  return {
    videoRef,
    isGenerating,
    leftPanelExpanded,
    setLeftPanelExpanded,
    rightPanelExpanded,
    setRightPanelExpanded,
    leftDrawerOpen,
    setLeftDrawerOpen,
    rightDrawerOpen,
    setRightDrawerOpen,
    isMusicPlaying,
    setIsMusicPlaying,
    isAudioUnlocked,
    musicVolume,
    setMusicVolume,
    authUser,
    userProfile,
    savedWorlds,
    activeWorldId,
    showRegionPrompt,
    showMobileGate,
    pastMobileGate,
    showMusicOnboarding,
    showCockpit,
    preferCreditPack,
    isMobile,
    ambientLayers,
    activeMusicStreamUrl,
    activeAmbienceUrl,
    ambienceVolume,
    handleMusicPlayingChange,
    handleUnlockAudio,
    handleMobileGateTap,
    handleCompleteMusicOnboarding,
    chooseRegion,
    handleRequireAuth,
    handleLoadWorld,
    handleDeleteWorld,
    handleRenameWorld,
    handleCheckout,
    handleDownload,
    handleEnterGalleryScene,
    handleGenerate,
    ...music,
  }
}
