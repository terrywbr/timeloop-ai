'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { requestAppFullscreen, requestLandscapeOrientation } from '@/lib/fullscreen'
import { useIsMobile } from '@/hooks/use-mobile'
import { useOrientation } from '@/hooks/use-orientation'
import { useClientMounted } from '@/hooks/use-client-mounted'
import { useAiDj } from '@/hooks/use-ai-dj'
import { useCompanion } from '@/hooks/use-companion'
import { useGoogleCalendar } from '@/hooks/use-google-calendar'
import type { CompanionEvent } from '@/lib/companion/types'
import { DJ_INTERVAL_MS } from '@/lib/dj-types'
import { markIntervalSpoken, shouldSpeakInterval, clearGreetDate } from '@/lib/dj-settings'
import type { Language } from '@/lib/translations'
import { type SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import type { GalleryWorld } from '@/lib/community/types'
import { isMusicMoodId } from '@/lib/music-moods'
import { useMusicStation } from '@/hooks/use-music-station'
import type { MusicMoodId } from '@/lib/music-moods'
import { resolveMoodWorldLayer } from '@/lib/mood-worlds'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { signInWithGoogle } from '@/lib/auth-google'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import {
  deleteWorld,
  fetchUserProfile,
  fetchWorldById,
  fetchWorlds,
  publishWorld,
  recordWorldView,
  startCheckout,
  updateWorldTitle,
  type UserAccountProfile,
} from '@/lib/api-client'
import { useCoFocus } from '@/hooks/use-cofocus'
import { markCoFocusSpokenToday, shouldSpeakCoFocusToday } from '@/lib/dj-settings'
import type { VideoBackgroundRef } from '@/components/ui/video-background'
import { AMBIENCE_AUDIO_SOURCES, AMBIENCE_VOLUME_RATIO } from '@/lib/timeloop/constants'
import type { AmbientWorldLayer, GalleryWorldAssets, GenerateApiResponse } from '@/lib/timeloop/types'
import { normalizeVisualEffectScene, resolveParticlePreset, resolvePresetWorld, type VisualEffectSceneKey } from '@/lib/timeloop/world-resolver'
import { buildStreamPlaybackUrl } from '@/lib/radio-station'
import { primeStreamAudio } from '@/lib/prime-stream-audio'
import {
  fetchGeoFromApi,
  getCachedGeoCountry,
  getStoredRegionPreference,
  isCachedGeoExpired,
  notifyGeoUpdated,
  setCachedGeoCountry,
} from '@/lib/geo-region'

type UseTimeloopPageOptions = {
  language: Language
  getDjPersonaName: (moodId: MusicMoodId) => string
}

export function useTimeloopPage({ language, getDjPersonaName }: UseTimeloopPageOptions) {
  const music = useMusicStation()
  const videoRef = useRef<VideoBackgroundRef>(null)
  const greetTriggeredRef = useRef(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(false)
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false)
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false)
  const [musicVolume, setMusicVolume] = useState(70)
  const [musicDuckActive, setMusicDuckActive] = useState(false)
  const [worldOverrideActive, setWorldOverrideActive] = useState(false)
  const [currentWorldId, setCurrentWorldId] = useState('neon-tokyo')
  const [currentGalleryAssets, setCurrentGalleryAssets] = useState<GalleryWorldAssets | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserAccountProfile | null>(null)
  const [savedWorlds, setSavedWorlds] = useState<PublicGeneratedWorld[]>([])
  const [activeWorldId, setActiveWorldId] = useState<string | null>(null)
  const [regionPreference, setRegionPreference] = useState<'global' | 'cn' | null>(null)
  const [isCnHost, setIsCnHost] = useState(false)
  const [showRegionPrompt, setShowRegionPrompt] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [coFocusEnabled, setCoFocusEnabled] = useState(false)
  const [enteredPublicWorldId, setEnteredPublicWorldId] = useState<string | null>(null)
  const [selectedVisualEffect, setSelectedVisualEffect] = useState<VisualEffectSceneKey>('cyberpunk')
  const isMobile = useIsMobile()
  const { isLandscape, isMobilePortrait } = useOrientation()
  const isClientMounted = useClientMounted()

  const {
    aiDj,
    speakLine,
    triggerGreeting,
    setVoiceEnabled,
    setIntervalEnabled,
    resetGreetSchedule,
    dismiss: dismissAiDj,
    isBusy,
  } = useAiDj({
    locale: language,
    getPersonaName: getDjPersonaName,
    onDuckMusic: setMusicDuckActive,
  })

  const effectiveMusicVolume = musicDuckActive ? Math.round(musicVolume * 0.7) : musicVolume

  const moodAmbientLayer = useMemo(() => {
    if (worldOverrideActive || !music.primaryMood) return null
    return resolveMoodWorldLayer(music.primaryMood)
  }, [music.primaryMood, worldOverrideActive])

  const presetWorld = resolvePresetWorld(currentWorldId, currentGalleryAssets?.particlePreset)
  const activeBackgroundImage =
    moodAmbientLayer?.backgroundImage ??
    currentGalleryAssets?.backgroundImage ??
    presetWorld.backgroundImage
  const activeDepthMap =
    moodAmbientLayer?.depthMap ?? currentGalleryAssets?.depthMap ?? presetWorld.depthMap
  const activeParticlePreset = resolveParticlePreset(selectedVisualEffect, presetWorld.particlePreset)
  const activeShaderPreset = moodAmbientLayer?.shaderPreset ?? presetWorld.shaderPreset
  const activeAmbienceAudio = moodAmbientLayer?.ambienceAudio ?? presetWorld.ambienceAudio
  const activeMusicStreamUrl = music.activeMusicStreamUrl
  const activeAmbienceUrl = AMBIENCE_AUDIO_SOURCES[activeAmbienceAudio] ?? ''
  const ambienceVolume = Math.round(musicVolume * AMBIENCE_VOLUME_RATIO)
  const activeAmbientLayer = useMemo<AmbientWorldLayer>(
    () => ({
      key: moodAmbientLayer?.key ?? [
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
      moodAmbientLayer?.key,
      currentWorldId,
      activeBackgroundImage,
      activeDepthMap,
      activeParticlePreset,
      activeShaderPreset,
      activeAmbienceAudio,
    ],
  )
  const [ambientLayers, setAmbientLayers] = useState<AmbientWorldLayer[]>(() => [activeAmbientLayer])

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient()
    } catch (error) {
      console.warn('[auth] Supabase client unavailable:', error)
      return null
    }
  }, [])

  const loadMoodWorld = useCallback(
    (moodId: MusicMoodId) => {
      music.setPrimaryMood(moodId)
      setWorldOverrideActive(false)
      setActiveWorldId(null)
      setCurrentWorldId(moodId)
      setCurrentGalleryAssets(null)
    },
    [music],
  )

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

  const showPortraitRotateGate = isClientMounted && isMobilePortrait
  const showMobileLandscapeUi = isClientMounted && (!isMobile || isLandscape)
  const showMusicOnboarding = showMobileLandscapeUi && !music.musicOnboarded
  const showCockpit = showMobileLandscapeUi && music.musicOnboarded
  const preferCreditPack = regionPreference === 'cn' || isCnHost

  const handleCompanionEvent = useCallback(
    (event: CompanionEvent) => {
      const moodId = music.primaryMood ?? 'deep-night'
      if (event.type === 'pomodoro') {
        if (event.phase === 'idle') return
        if (event.previousPhase === 'idle' && event.phase === 'focus') {
          void speakLine({ moodId, sessionType: 'pomodoro', context: { phase: 'focus' }, force: true })
        } else if (event.previousPhase === 'focus' && event.phase !== 'focus') {
          void speakLine({ moodId, sessionType: 'pomodoro', context: { phase: event.phase }, force: true })
        }
        return
      }
      if (event.type === 'alarm') {
        void speakLine({
          moodId,
          sessionType: 'alarm',
          context: { alarmLabel: event.alarm.label || 'Alarm' },
          force: true,
        })
      }
    },
    [music.primaryMood, speakLine],
  )

  const handleCalendarReminder = useCallback(
    (context: { eventTitle?: string; minutesUntil?: number }) => {
      const moodId = music.primaryMood ?? 'deep-night'
      void speakLine({
        moodId,
        sessionType: 'calendar',
        context,
        force: true,
      })
    },
    [music.primaryMood, speakLine],
  )

  const companion = useCompanion({
    cockpitActive: showCockpit,
    onCompanionEvent: handleCompanionEvent,
    isDjBusy: isBusy,
  })

  const calendar = useGoogleCalendar({
    cockpitActive: showCockpit,
    isAuthenticated: Boolean(authUser),
    accessToken,
    onCalendarReminder: handleCalendarReminder,
    isDjBusy: isBusy,
  })

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
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') !== 'success') return

    params.delete('checkout')
    const query = params.toString()
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState({}, '', nextUrl)

    const messages: Partial<Record<Language, string>> = {
      en: 'Payment successful! Updating your membership…',
      'zh-cn': '付款成功！正在更新会员状态…',
      'zh-tw': '付款成功！正在更新會員狀態…',
      ja: 'お支払いが完了しました。会員ステータスを更新しています…',
      ko: '결제가 완료되었습니다. 멤버십 상태를 업데이트하는 중…',
      es: 'Pago completado. Actualizando tu membresía…',
      fr: 'Paiement réussi. Mise à jour de votre abonnement…',
      de: 'Zahlung erfolgreich. Mitgliedschaft wird aktualisiert…',
    }
    window.alert(messages[language] ?? messages.en)

    void refreshAccountData()
    let attempts = 0
    const pollId = window.setInterval(() => {
      attempts += 1
      void refreshAccountData()
      if (attempts >= 6) window.clearInterval(pollId)
    }, 3000)

    return () => window.clearInterval(pollId)
  }, [language, refreshAccountData])

  useEffect(() => {
    if (!supabase) return

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setAuthUser(data.session?.user ?? null)
        setAccessToken(data.session?.access_token ?? null)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!music.musicOnboarded || !music.currentStation) return
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
  }, [music.musicOnboarded, music.currentStation])

  useEffect(() => {
    const hostname = window.location.hostname
    const currentIsCnHost = hostname === 'cn.localhost' || hostname.startsWith('cn.')
    setIsCnHost(currentIsCnHost)

    const storedPreference = getStoredRegionPreference()
    if (storedPreference) {
      setRegionPreference(storedPreference)
      return
    }

    let cancelled = false

    void (async () => {
      let suggestRegionPrompt = false

      if (!isCachedGeoExpired()) {
        if (getCachedGeoCountry() === 'CN') suggestRegionPrompt = true
      } else {
        const geo = await fetchGeoFromApi()
        if (geo) {
          setCachedGeoCountry(geo.country)
          if (geo.suggestCn) suggestRegionPrompt = true
        } else if (getCachedGeoCountry() === 'CN') {
          suggestRegionPrompt = true
        }
      }

      if (cancelled) return

      if (!suggestRegionPrompt) {
        const language = navigator.language.toLowerCase()
        if (language === 'zh-cn') suggestRegionPrompt = true
      }

      if (!currentIsCnHost && suggestRegionPrompt) {
        setShowRegionPrompt(true)
      }

      notifyGeoUpdated()
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const chooseRegion = useCallback((region: 'global' | 'cn') => {
    localStorage.setItem('timeloop-region', region)
    setRegionPreference(region)
    setShowRegionPrompt(false)
    notifyGeoUpdated()

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
    setEnteredPublicWorldId(world.isPrivate === false ? world.id : null)
    setActiveWorldId(world.id)
    setCurrentWorldId(world.id)
    setCurrentGalleryAssets({
      backgroundImage: world.backgroundImage,
      depthMap: world.depthMap,
      particlePreset: world.particlePreset,
    })
    setSelectedVisualEffect(normalizeVisualEffectScene(world.particlePreset))
    setWorldOverrideActive(true)
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
      const { initial, primaryMood } = music.completeMusicOnboarding(moods)
      loadMoodWorld(primaryMood)
      setIsAudioUnlocked(true)
      setIsMusicPlaying(true)
      primeStreamAudio(buildStreamPlaybackUrl(initial), musicVolume)
      resetGreetSchedule()
      greetTriggeredRef.current = true
      markIntervalSpoken()
      void triggerGreeting({
        moodId: primaryMood,
        stationName: initial.name,
        sessionType: 'enter',
        force: true,
      })
      if (isMobile) {
        void requestAppFullscreen()
        void requestLandscapeOrientation()
      }
    },
    [isMobile, loadMoodWorld, music, musicVolume, resetGreetSchedule, triggerGreeting],
  )

  const handleReopenMusicOnboarding = useCallback(() => {
    clearGreetDate()
    resetGreetSchedule()
    music.reopenMusicOnboarding()
  }, [music, resetGreetSchedule])

  const handleEnterGalleryScene = useCallback(
    (item: GallerySceneItem) => {
      const nextWorldId = item.worldId
      const backgroundImage = `/gallery/backgrounds/${item.id}-bg.jpg`
      const depthMap = `/gallery/depths/${item.id}-depth.jpg`

      setEnteredPublicWorldId(null)
      setActiveWorldId(null)
      setCurrentWorldId(nextWorldId)
      setCurrentGalleryAssets({ backgroundImage, depthMap })
      setWorldOverrideActive(true)
      setIsAudioUnlocked(true)
      music.loadStationForWorld(nextWorldId)
      setIsMusicPlaying(true)
      setRightPanelExpanded(false)
    },
    [music],
  )

  const handleEnterPublicWorld = useCallback(
    (world: GalleryWorld) => {
      setEnteredPublicWorldId(world.id)
      setActiveWorldId(world.id)
      setCurrentWorldId(world.id)
      setCurrentGalleryAssets({
        backgroundImage: world.backgroundImage,
        depthMap: world.depthMap,
        particlePreset: world.particlePreset,
      })
      setSelectedVisualEffect(normalizeVisualEffectScene(world.particlePreset))
      setWorldOverrideActive(true)
      setIsAudioUnlocked(true)
      const moodForStation =
        world.moodId && isMusicMoodId(world.moodId)
          ? world.moodId
          : music.primaryMood ?? 'deep-night'
      music.setPrimaryMood(moodForStation)
      setIsMusicPlaying(true)
      setRightPanelExpanded(false)
      setRightDrawerOpen(false)
      void recordWorldView(world.id)
    },
    [music],
  )

  const handlePublishWorld = useCallback(
    async (worldId: string, isPublic: boolean) => {
      const token = await getAccessToken()
      if (!token) {
        await handleRequireAuth()
        return
      }
      try {
        await publishWorld(token, worldId, { isPublic })
        void refreshAccountData()
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Publish failed')
      }
    },
    [getAccessToken, handleRequireAuth, refreshAccountData],
  )

  const coFocusWorldId = coFocusEnabled && enteredPublicWorldId ? enteredPublicWorldId : null
  const { presenceCount } = useCoFocus({
    worldId: coFocusWorldId,
    enabled: coFocusEnabled,
    accessToken,
    cockpitActive: showCockpit,
  })

  useEffect(() => {
    if (!showCockpit || !coFocusEnabled || !enteredPublicWorldId || presenceCount < 2) return
    if (!music.primaryMood || isBusy()) return
    if (!shouldSpeakCoFocusToday(enteredPublicWorldId)) return

    markCoFocusSpokenToday(enteredPublicWorldId)
    void speakLine({
      moodId: music.primaryMood,
      sessionType: 'cofocus',
      context: { coFocusCount: presenceCount },
      force: true,
    })
  }, [
    coFocusEnabled,
    enteredPublicWorldId,
    isBusy,
    music.primaryMood,
    presenceCount,
    showCockpit,
    speakLine,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const worldId = params.get('world')?.trim()
    if (!worldId || !showCockpit) return

    void (async () => {
      const token = await getAccessToken()
      const world = await fetchWorldById(worldId, token)
      if (world) handleEnterPublicWorld(world)
    })()
  }, [getAccessToken, handleEnterPublicWorld, showCockpit])

  const handleGenerate = useCallback(
    async (prompt: string, scene?: string) => {
      const trimmedPrompt = prompt.trim()
      if (!trimmedPrompt) return
      const effectScene = scene ? normalizeVisualEffectScene(scene) : selectedVisualEffect
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
            particlePreset: effectScene,
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
        setSelectedVisualEffect(normalizeVisualEffectScene(res.world.particlePreset))
        setWorldOverrideActive(true)
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
    [authUser, handleRequireAuth, refreshAccountData, selectedVisualEffect, supabase],
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

  useEffect(() => {
    if (!music.musicOnboarded || !music.primaryMood || showMusicOnboarding) return
    if (!showCockpit) return
    if (greetTriggeredRef.current) return

    loadMoodWorld(music.primaryMood)
    greetTriggeredRef.current = true

    void triggerGreeting({
      moodId: music.primaryMood,
      stationName: music.currentStation?.name,
      sessionType: 'return',
    })
  }, [
    loadMoodWorld,
    music.currentStation?.name,
    music.musicOnboarded,
    music.primaryMood,
    showCockpit,
    showMusicOnboarding,
    triggerGreeting,
  ])

  useEffect(() => {
    if (!showCockpit || !music.primaryMood) return
    markIntervalSpoken()
  }, [showCockpit, music.primaryMood])

  useEffect(() => {
    if (!showCockpit || !music.primaryMood || !aiDj.intervalEnabled) return

    const checkInterval = () => {
      if (document.visibilityState !== 'visible') return
      if (isBusy()) return
      const now = Date.now()
      if (!shouldSpeakInterval(now, DJ_INTERVAL_MS)) return
      void speakLine({
        moodId: music.primaryMood!,
        sessionType: 'interval',
        stationName: music.currentStation?.name,
        force: true,
      })
      markIntervalSpoken(now)
    }

    const id = window.setInterval(checkInterval, 60_000)
    return () => window.clearInterval(id)
  }, [
    aiDj.intervalEnabled,
    isBusy,
    music.currentStation?.name,
    music.primaryMood,
    showCockpit,
    speakLine,
  ])

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
    effectiveMusicVolume,
    setMusicVolume,
    authUser,
    userProfile,
    savedWorlds,
    activeWorldId,
    showRegionPrompt,
    showPortraitRotateGate,
    showMusicOnboarding,
    showCockpit,
    preferCreditPack,
    isClientMounted,
    isMobile,
    isMobilePortrait,
    ambientLayers,
    activeAmbienceUrl,
    ambienceVolume,
    handleMusicPlayingChange,
    handleUnlockAudio,
    handleCompleteMusicOnboarding,
    chooseRegion,
    handleRequireAuth,
    handleLoadWorld,
    handleDeleteWorld,
    handleRenameWorld,
    handleCheckout,
    handleDownload,
    handleEnterGalleryScene,
    handleEnterPublicWorld,
    handlePublishWorld,
    accessToken,
    coFocusEnabled,
    setCoFocusEnabled,
    presenceCount,
    handleGenerate,
    selectedVisualEffect,
    setSelectedVisualEffect,
    ...music,
    handleReopenMusicOnboarding,
    aiDj,
    setDjVoiceEnabled: setVoiceEnabled,
    setDjIntervalEnabled: setIntervalEnabled,
    dismissAiDj,
    companion,
    calendar,
  }
}
