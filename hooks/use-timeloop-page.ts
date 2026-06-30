'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { requestAppFullscreen, requestLandscapeOrientation } from '@/lib/fullscreen'
import { useIsMobile } from '@/hooks/use-mobile'
import { useOrientation } from '@/hooks/use-orientation'
import { useClientMounted } from '@/hooks/use-client-mounted'
import { useAiDj } from '@/hooks/use-ai-dj'
import { DJ_INTERVAL_MS } from '@/lib/dj-types'
import { markIntervalSpoken, shouldSpeakInterval, clearGreetDate } from '@/lib/dj-settings'
import type { Language } from '@/lib/translations'
import { translations } from '@/lib/translations'
import { type SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'
import type { GalleryWorld } from '@/lib/community/types'
import { isMusicMoodId } from '@/lib/music-moods'
import { useMusicStation } from '@/hooks/use-music-station'
import type { MusicMoodId } from '@/lib/music-moods'
import { resolveMoodWorldLayer } from '@/lib/mood-worlds'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { signInWithGoogle } from '@/lib/auth-google'
import { signOutAndRedirect } from '@/lib/auth-sign-out'
import type { PublicGeneratedWorld } from '@/lib/supabase-types'
import {
  activateStreamerScenePack,
  addGeneratedStreamerBackground,
  createStreamerScenePack,
  deleteStreamerScenePack,
  deleteWorld,
  deleteStreamerBackground,
  downloadBackgroundImage,
  fetchStreamerScenePacks,
  fetchStreamerBackgrounds,
  fetchStreamerSettings,
  generateStreamerScenePackImages,
  fetchUserProfile,
  fetchWorldById,
  fetchWorlds,
  publishWorld,
  recordWorldView,
  saveStreamerSettings,
  startCheckout,
  type StreamerScenePack,
  uploadStreamerBackground,
  updateWorldTitle,
  type CheckoutKind,
  type UserAccountProfile,
} from '@/lib/api-client'
import {
  buildStreamModeUrl,
  markStreamerLiveLaunchedToday,
  openStreamModePopout,
  readStreamerLiveLaunchedToday,
  readStreamModeFromWindow,
} from '@/lib/stream-mode'
import { getDefaultStreamerOverlayTemplate } from '@/lib/streamer-overlay-templates'
import {
  DEFAULT_STREAMER_SETTINGS,
  normalizeStreamerSettings,
  type StreamerSettings,
} from '@/lib/streamer-settings'
import { useCoFocus } from '@/hooks/use-cofocus'
import { markCoFocusSpokenToday, shouldSpeakCoFocusToday } from '@/lib/dj-settings'
import type { VideoBackgroundRef } from '@/components/ui/video-background'
import type { AmbientWorldLayer, GalleryWorldAssets, GenerateApiResponse } from '@/lib/timeloop/types'
import { normalizeVisualEffectScene, resolveParticlePreset, resolvePresetWorld, type VisualEffectSceneKey } from '@/lib/timeloop/world-resolver'
import { buildStreamPlaybackUrl, resolveInitialProxyTier } from '@/lib/radio-station'
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

const STREAMER_ROTATION_MAX = 20
const LOCAL_STREAMER_BACKGROUNDS_KEY_PREFIX = 'timeloop.streamer.rotation.backgrounds'
const LOCAL_STREAMER_BACKGROUNDS_FALLBACK_KEY = 'timeloop.streamer.rotation.backgrounds:last'
const LOCAL_STREAMER_ROTATION_WORLD_IDS_KEY = 'timeloop.streamer.rotation.worldIds'
const PENDING_CHECKOUT_KEY = 'timeloop.pending-checkout'

export type RequireAuthOptions = {
  requestFullscreen?: boolean
}

function isMissingStreamerTablesError(message: string) {
  const lower = message.toLowerCase()
  const missing = lower.includes('could not find') || lower.includes('does not exist')
  const table = lower.includes('public.streamer_backgrounds') || lower.includes('public.streamer_settings')
  return missing && table
}

function normalizeStreamerBackgrounds(
  items: Array<{ id: string; public_url: string; sort_order: number }>,
) {
  const byUrl = new Map<string, { id: string; public_url: string; sort_order: number }>()
  for (const item of items) {
    const key = item.public_url.trim()
    if (!key || byUrl.has(key)) continue
    byUrl.set(key, item)
  }
  return Array.from(byUrl.values())
    .slice(0, STREAMER_ROTATION_MAX)
    .map((item, index) => ({ ...item, sort_order: index }))
}

function normalizeRotationUrls(urls: string[]) {
  const uniqueUrls: string[] = []
  const seen = new Set<string>()
  for (const url of urls) {
    const key = url.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    uniqueUrls.push(key)
  }
  return uniqueUrls.slice(0, STREAMER_ROTATION_MAX)
}

function normalizeRotationWorldIds(ids: string[]) {
  const uniqueIds: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    const key = id.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    uniqueIds.push(key)
  }
  return uniqueIds.slice(0, STREAMER_ROTATION_MAX)
}

function readStoredRotationWorldIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_STREAMER_ROTATION_WORLD_IDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return normalizeRotationWorldIds(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return []
  }
}

function writeStoredRotationWorldIds(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      LOCAL_STREAMER_ROTATION_WORLD_IDS_KEY,
      JSON.stringify(normalizeRotationWorldIds(ids)),
    )
  } catch {
    // Ignore local storage write errors in private/incognito contexts.
  }
}

export function useTimeloopPage({ language, getDjPersonaName }: UseTimeloopPageOptions) {
  const music = useMusicStation()
  const videoRef = useRef<VideoBackgroundRef>(null)
  const greetTriggeredRef = useRef(false)
  const firstVisitIntroPlayedRef = useRef(false)
  const backgroundRotationLastTickRef = useRef(Date.now())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
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
  const [manualPreviewActive, setManualPreviewActive] = useState(false)
  const [isStreamMode] = useState(() => readStreamModeFromWindow())
  const [streamerSettings, setStreamerSettings] = useState<StreamerSettings>(DEFAULT_STREAMER_SETTINGS)
  const [streamerBackgrounds, setStreamerBackgrounds] = useState<
    Array<{ id: string; public_url: string; sort_order: number }>
  >([])
  const [selectedRotationWorldIds, setSelectedRotationWorldIds] = useState<string[]>(() =>
    readStoredRotationWorldIds(),
  )
  const selectedRotationWorldIdsRef = useRef<string[]>(selectedRotationWorldIds)
  const [isStreamerBackgroundUploading, setIsStreamerBackgroundUploading] = useState(false)
  const [backgroundRotationIndex, setBackgroundRotationIndex] = useState(0)
  const [streamerScenePacks, setStreamerScenePacks] = useState<StreamerScenePack[]>([])
  const [isScenePackGenerating, setIsScenePackGenerating] = useState(false)
  const [activeScenePackItemIndex, setActiveScenePackItemIndex] = useState(0)
  const [communityRefreshKey, setCommunityRefreshKey] = useState(0)
  const [streamerLiveLaunchedToday, setStreamerLiveLaunchedToday] = useState(() =>
    readStreamerLiveLaunchedToday(),
  )
  const isMobile = useIsMobile()
  const { isLandscape, isMobilePortrait } = useOrientation()
  const isClientMounted = useClientMounted()

  const {
    aiDj,
    speakLine,
    triggerGreeting,
    setVoiceEnabled,
    resetGreetSchedule,
    dismiss: dismissAiDj,
    isBusy,
  } = useAiDj({
    locale: language,
    getPersonaName: getDjPersonaName,
    onDuckMusic: setMusicDuckActive,
  })

  const effectiveMusicVolume = musicDuckActive ? Math.round(musicVolume * 0.3) : musicVolume

  const moodAmbientLayer = useMemo(() => {
    if (worldOverrideActive || !music.primaryMood) return null
    return resolveMoodWorldLayer(music.primaryMood)
  }, [music.primaryMood, worldOverrideActive])

  const presetWorld = resolvePresetWorld(currentWorldId, currentGalleryAssets?.particlePreset)
  const activeScenePack = useMemo(
    () => streamerScenePacks.find((pack) => pack.status === 'active') ?? null,
    [streamerScenePacks],
  )
  const activeScenePackItems = useMemo(
    () =>
      (activeScenePack?.items ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [activeScenePack],
  )
  const activeScenePackImage =
    activeScenePackItems.length > 0
      ? activeScenePackItems[activeScenePackItemIndex % activeScenePackItems.length]?.imageUrl
      : null
  const rotationWorlds = useMemo(
    () =>
      normalizeRotationWorldIds(selectedRotationWorldIds).flatMap((worldId) => {
        const world = savedWorlds.find((item) => item.id === worldId)
        return world ? [world] : []
      }),
    [savedWorlds, selectedRotationWorldIds],
  )
  const rotationBackgrounds = useMemo(
    () => {
      const rowsByUrl = new Map(streamerBackgrounds.map((item) => [item.public_url, item]))
      return rotationWorlds.map((world, index) => {
        const url = world.backgroundImage.trim()
        const row = rowsByUrl.get(url)
        return row ?? { id: `world:${world.id}`, public_url: url, sort_order: index }
      })
    },
    [rotationWorlds, streamerBackgrounds],
  )
  const rotatedStreamerWorld =
    rotationWorlds.length > 0 ? rotationWorlds[backgroundRotationIndex % rotationWorlds.length] : null
  const rotatedStreamerBackground =
    rotatedStreamerWorld?.backgroundImage ?? rotationBackgrounds[backgroundRotationIndex % rotationBackgrounds.length]?.public_url ?? null
  const activeBackgroundImage =
    (manualPreviewActive ? currentGalleryAssets?.backgroundImage : null) ??
    rotatedStreamerBackground ??
    activeScenePackImage ??
    moodAmbientLayer?.backgroundImage ??
    currentGalleryAssets?.backgroundImage ??
    presetWorld.backgroundImage
  const activeDepthMap =
    rotatedStreamerWorld?.depthMap ??
    moodAmbientLayer?.depthMap ??
    currentGalleryAssets?.depthMap ??
    presetWorld.depthMap
  const activeParticlePreset = resolveParticlePreset(
    selectedVisualEffect,
    rotatedStreamerWorld?.particlePreset ?? presetWorld.particlePreset,
  )
  const activeShaderPreset = moodAmbientLayer?.shaderPreset ?? presetWorld.shaderPreset
  const activeAmbienceAudio = moodAmbientLayer?.ambienceAudio ?? presetWorld.ambienceAudio
  const activeMusicStreamUrl = music.activeMusicStreamUrl
  const activeAmbientLayer = useMemo<AmbientWorldLayer>(
    () => ({
      key: [
        moodAmbientLayer?.key ?? 'custom',
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

  useEffect(() => {
    selectedRotationWorldIdsRef.current = selectedRotationWorldIds
  }, [selectedRotationWorldIds])

  const loadMoodWorld = useCallback(
    (moodId: MusicMoodId) => {
      music.setPrimaryMood(moodId)
      setWorldOverrideActive(false)
      setActiveWorldId(null)
      setCurrentWorldId(moodId)
      setCurrentGalleryAssets(null)
      setManualPreviewActive(false)
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

  // Unlock audio on the very first user interaction anywhere on the page,
  // so music starts without requiring a click on the specific unlock button.
  useEffect(() => {
    if (isAudioUnlocked) return
    const unlock = () => { handleUnlockAudio() }
    document.addEventListener('pointerdown', unlock, { once: true, passive: true })
    return () => { document.removeEventListener('pointerdown', unlock) }
  }, [isAudioUnlocked, handleUnlockAudio])

  const showPortraitRotateGate = isClientMounted && isMobilePortrait
  const showMobileLandscapeUi = isClientMounted && (!isMobile || isLandscape)
  const showMusicOnboarding = !isStreamMode && showMobileLandscapeUi && !music.musicOnboarded
  const showCockpit = !isStreamMode && showMobileLandscapeUi && music.musicOnboarded
  const showStreamLayout = isStreamMode && music.musicOnboarded && !isMobilePortrait
  const shouldKeepMusicAlive = showMusicOnboarding || showCockpit || showStreamLayout

  useEffect(() => {
    if (!shouldKeepMusicAlive || !music.activeMusicStreamUrl) return
    if (isMusicPlaying) return

    // Live-broadcast requirement: keep music continuously alive.
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
    primeStreamAudio(music.activeMusicStreamUrl, musicVolume)
  }, [
    shouldKeepMusicAlive,
    music.activeMusicStreamUrl,
    isMusicPlaying,
    musicVolume,
  ])

  useEffect(() => {
    if (isStreamMode || music.musicOnboarded || !showMusicOnboarding) return
    if (firstVisitIntroPlayedRef.current) return

    firstVisitIntroPlayedRef.current = true
    const initialMood = music.primaryMood ?? 'deep-night'
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
    if (music.activeMusicStreamUrl) {
      primeStreamAudio(music.activeMusicStreamUrl, musicVolume)
    }
    let retryTimer: number | null = null
    void (async () => {
      const played = await triggerGreeting({
        moodId: initialMood,
        stationName: music.currentStation?.name,
        sessionType: 'enter',
        force: true,
      })
      if (played) return

      // First-visit reliability: retry exactly once after 2s when the initial
      // attempt was skipped (e.g. another line was in-flight at the same time).
      retryTimer = window.setTimeout(() => {
        void triggerGreeting({
          moodId: initialMood,
          stationName: music.currentStation?.name,
          sessionType: 'enter',
          force: true,
        })
      }, 2000)
    })()

    return () => {
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer)
      }
    }
  }, [
    isStreamMode,
    music.musicOnboarded,
    showMusicOnboarding,
    music.primaryMood,
    music.activeMusicStreamUrl,
    music.currentStation?.name,
    musicVolume,
    triggerGreeting,
  ])

  const hasCreatorTools = Boolean(userProfile?.hasCreatorTools)
  const localStreamerBackgroundsKey = authUser?.id
    ? `${LOCAL_STREAMER_BACKGROUNDS_KEY_PREFIX}:${authUser.id}`
    : null

  const readLocalStreamerBackgrounds = useCallback(() => {
    if (typeof window === 'undefined') return []
    try {
      const keys = [
        localStreamerBackgroundsKey,
        LOCAL_STREAMER_BACKGROUNDS_FALLBACK_KEY,
      ].filter((key): key is string => Boolean(key))
      const items = keys.flatMap((key) => {
        const raw = window.localStorage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw) as Array<{ id: string; public_url: string; sort_order: number }>
        if (!Array.isArray(parsed)) return []
        return parsed.filter(
          (item): item is { id: string; public_url: string; sort_order: number } =>
            Boolean(
              item &&
                typeof item.id === 'string' &&
                typeof item.public_url === 'string' &&
                typeof item.sort_order === 'number',
            ),
        )
      })
      return normalizeStreamerBackgrounds(items)
    } catch {
      return []
    }
  }, [localStreamerBackgroundsKey])

  const writeLocalStreamerBackgrounds = useCallback(
    (items: Array<{ id: string; public_url: string; sort_order: number }>) => {
      if (typeof window === 'undefined') return
      try {
        const normalized = normalizeStreamerBackgrounds(items)
        const serialized = JSON.stringify(normalized)
        window.localStorage.setItem(LOCAL_STREAMER_BACKGROUNDS_FALLBACK_KEY, serialized)
        if (localStreamerBackgroundsKey) {
          window.localStorage.setItem(localStreamerBackgroundsKey, serialized)
        }
      } catch {
        // Ignore local storage write errors in private/incognito contexts.
      }
    },
    [localStreamerBackgroundsKey],
  )
  const preferCreditPack = regionPreference === 'cn' || isCnHost
  const effectiveOverlaySettings = useMemo(() => {
    const settings = normalizeStreamerSettings(streamerSettings)
    const template = getDefaultStreamerOverlayTemplate(language)
    if (!settings.overlay.line1.trim() && !settings.overlay.line2.trim()) {
      return {
        ...settings.overlay,
        line1: template.line1,
        line2: template.line2,
      }
    }
    return settings.overlay
  }, [language, streamerSettings])

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
    if (!isStreamMode || music.musicOnboarded) return
    const { initial, primaryMood } = music.completeMusicOnboarding(['deep-night'])
    loadMoodWorld(primaryMood)
    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
    primeStreamAudio(buildStreamPlaybackUrl(initial, resolveInitialProxyTier()), musicVolume)
  }, [
    isStreamMode,
    loadMoodWorld,
    music.completeMusicOnboarding,
    music.musicOnboarded,
    musicVolume,
  ])

  useEffect(() => {
    if (!accessToken || !hasCreatorTools) return
    void (async () => {
      try {
        const [settings, backgrounds, packs] = await Promise.all([
          fetchStreamerSettings(accessToken),
          fetchStreamerBackgrounds(accessToken),
          fetchStreamerScenePacks(accessToken),
        ])
        if (settings) {
          setStreamerSettings(normalizeStreamerSettings(settings as StreamerSettings))
        }

        const localBackgrounds = readLocalStreamerBackgrounds()
        setStreamerBackgrounds((current) => {
          const next = normalizeStreamerBackgrounds([
            ...current,
            ...localBackgrounds,
            ...backgrounds,
          ])
          writeLocalStreamerBackgrounds(next)
          return next
        })
        setStreamerScenePacks(packs)
        setActiveScenePackItemIndex(0)
      } catch {
        const localBackgrounds = readLocalStreamerBackgrounds()
        setStreamerBackgrounds((current) => normalizeStreamerBackgrounds([...current, ...localBackgrounds]))
      }
    })()
  }, [
    accessToken,
    hasCreatorTools,
    readLocalStreamerBackgrounds,
    writeLocalStreamerBackgrounds,
  ])

  useEffect(() => {
    const restoreLocalBackgrounds = () => {
      const localBackgrounds = readLocalStreamerBackgrounds()
      const nextWorldIds = readStoredRotationWorldIds()
      if (nextWorldIds.length > 0) {
        selectedRotationWorldIdsRef.current = nextWorldIds
        setSelectedRotationWorldIds(nextWorldIds)
      }
      if (localBackgrounds.length === 0) return
      setStreamerBackgrounds((current) =>
        normalizeStreamerBackgrounds([...current, ...localBackgrounds]),
      )
    }

    restoreLocalBackgrounds()
    window.addEventListener('focus', restoreLocalBackgrounds)
    document.addEventListener('visibilitychange', restoreLocalBackgrounds)
    return () => {
      window.removeEventListener('focus', restoreLocalBackgrounds)
      document.removeEventListener('visibilitychange', restoreLocalBackgrounds)
    }
  }, [readLocalStreamerBackgrounds])

  useEffect(() => {
    if (savedWorlds.length === 0 || selectedRotationWorldIds.length === 0) return
    const myWorldIds = new Set(savedWorlds.map((world) => world.id))
    const nextWorldIds = normalizeRotationWorldIds(
      selectedRotationWorldIds.filter((id) => myWorldIds.has(id)),
    )
    if (nextWorldIds.length === selectedRotationWorldIds.length) return
    selectedRotationWorldIdsRef.current = nextWorldIds
    setSelectedRotationWorldIds(nextWorldIds)
    writeStoredRotationWorldIds(nextWorldIds)
    setBackgroundRotationIndex(0)
  }, [savedWorlds, selectedRotationWorldIds])

  useEffect(() => {
    if (rotationWorlds.length === 0) {
      setBackgroundRotationIndex(0)
      return
    }
    setBackgroundRotationIndex((index) => index % rotationWorlds.length)
  }, [rotationWorlds.length])

  useEffect(() => {
    const rotationCount = rotationWorlds.length
    backgroundRotationLastTickRef.current = Date.now()
    if (rotationCount < 2) return

    const minutes = streamerSettings.backgroundRotationMinutes === 10 ? 10 : 5
    const intervalMs = minutes * 60 * 1000
    const timer = window.setInterval(() => {
      const now = Date.now()
      if (now - backgroundRotationLastTickRef.current < intervalMs) return
      backgroundRotationLastTickRef.current = now
      setManualPreviewActive(false)
      setBackgroundRotationIndex((index) => (index + 1) % rotationCount)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [rotationWorlds.length, streamerSettings.backgroundRotationMinutes])

  useEffect(() => {
    if (activeScenePackItems.length <= 1) return
    const currentItem = activeScenePackItems[activeScenePackItemIndex % activeScenePackItems.length]
    const delayMs = Math.max(15, currentItem?.durationSec ?? 120) * 1000
    const timer = window.setTimeout(() => {
      setActiveScenePackItemIndex((index) => {
        if (activeScenePack?.playOrder === 'random') {
          return Math.floor(Math.random() * activeScenePackItems.length)
        }
        const next = index + 1
        return activeScenePack?.isLoop === false ? Math.min(next, activeScenePackItems.length - 1) : next % activeScenePackItems.length
      })
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [activeScenePack, activeScenePackItems, activeScenePackItemIndex])

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
      'zh-CN': '付款成功！正在更新会员状态…',
      'zh-TW': '付款成功！正在更新會員狀態…',
      ja: 'お支払いが完了しました。会員ステータスを更新しています…',
      ko: '결제가 완료되었습니다. 멤버십 상태를 업데이트하는 중…',
      es: 'Pago completado. Actualizando tu membresía…',
      fr: 'Paiement réussi. Mise à jour de votre abonnement…',
      de: 'Zahlung erfolgreich. Mitgliedschaft wird aktualisiert…',
      th: 'ชำระเงินสำเร็จ! กำลังอัปเดตสมาชิก…',
      vi: 'Thanh toán thành công! Đang cập nhật tư cách thành viên…',
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

  const handleRequireAuth = useCallback(async (options?: RequireAuthOptions) => {
    if (options?.requestFullscreen) {
      void requestAppFullscreen()
    }
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

  const handleSignOut = useCallback(async () => {
    if (!supabase || isSigningOut) return
    setIsSigningOut(true)
    try {
      await signOutAndRedirect(supabase)
    } catch (error) {
      setIsSigningOut(false)
      const message = error instanceof Error ? error.message : 'Sign out failed'
      window.alert(message)
    }
  }, [isSigningOut, supabase])

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
    setManualPreviewActive(true)
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
    async (kind: CheckoutKind) => {
      if (preferCreditPack && (kind === 'vip' || kind === 'subscription' || kind === 'streamer')) {
        const cnCheckoutBlocked: Partial<Record<Language, string>> = {
          en: 'Global Lemon checkout is disabled on the China entry. Please use the WeChat manual upgrade panel below.',
          'zh-CN': '大陆入口暂不支持 Lemon 在线结账，请使用下方微信人工开通面板。',
          'zh-TW': '大陸入口暫不支援 Lemon 線上結帳，請使用下方微信人工開通面板。',
        }
        window.alert(cnCheckoutBlocked[language] ?? cnCheckoutBlocked.en)
        return
      }

      let accessToken = await getAccessToken()
      if (!accessToken) {
        try {
          window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, kind)
        } catch {
          // Ignore sessionStorage errors in private browsing.
        }
        await handleRequireAuth({ requestFullscreen: false })
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
    [getAccessToken, handleRequireAuth, language, preferCreditPack],
  )

  useEffect(() => {
    if (!authUser) return
    let pendingKind: CheckoutKind | null = null
    try {
      const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY)
      if (raw === 'vip' || raw === 'streamer' || raw === 'credits' || raw === 'subscription') {
        pendingKind = raw
        window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
      }
    } catch {
      return
    }
    if (!pendingKind) return
    void handleCheckout(pendingKind)
  }, [authUser, handleCheckout])

  const handleCreateStreamerScenePack = useCallback(
    async (input: { name: string; moodId: MusicMoodId }) => {
      const token = await getAccessToken()
      if (!token) {
        await handleRequireAuth()
        return
      }
      try {
        const pack = await createStreamerScenePack(token, {
          name: input.name,
          moodId: input.moodId,
          playOrder: 'sequential',
          isLoop: true,
        })
        setStreamerScenePacks((items) => [pack, ...items])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Create scene pack failed'
        window.alert(message)
      }
    },
    [getAccessToken, handleRequireAuth],
  )

  const handleGenerateStreamerScenePack = useCallback(
    async (packId: string, input: { prompt: string; count: number; durationSec: number }) => {
      const token = await getAccessToken()
      if (!token) {
        await handleRequireAuth()
        return
      }
      setIsScenePackGenerating(true)
      try {
        const result = await generateStreamerScenePackImages(token, packId, {
          prompt: input.prompt,
          count: input.count,
          durationSec: input.durationSec,
          particlePreset: selectedVisualEffect,
        })
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                streamerMonthlyQuotaImages: result.usage.quotaImages,
                streamerUsedImages: result.usage.usedImages,
                streamerRemainingImages: result.usage.remainingImages,
              }
            : prev,
        )
        const packs = await fetchStreamerScenePacks(token)
        setStreamerScenePacks(packs)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generate scene pack images failed'
        window.alert(message)
      } finally {
        setIsScenePackGenerating(false)
      }
    },
    [getAccessToken, handleRequireAuth, selectedVisualEffect],
  )

  const handleActivateStreamerScenePack = useCallback(
    async (packId: string) => {
      const token = await getAccessToken()
      if (!token) return
      try {
        await activateStreamerScenePack(token, packId)
        const packs = await fetchStreamerScenePacks(token)
        setStreamerScenePacks(packs)
        setActiveScenePackItemIndex(0)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Activate scene pack failed'
        window.alert(message)
      }
    },
    [getAccessToken],
  )

  const handleDeleteStreamerScenePack = useCallback(
    async (packId: string) => {
      const token = await getAccessToken()
      if (!token) return
      try {
        await deleteStreamerScenePack(token, packId)
        setStreamerScenePacks((items) => items.filter((item) => item.id !== packId))
        setActiveScenePackItemIndex(0)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Delete scene pack failed'
        window.alert(message)
      }
    },
    [getAccessToken],
  )

  const handleUploadStreamerBackground = useCallback(
    async (file: File) => {
      const token = await getAccessToken()
      if (!token) {
        await handleRequireAuth()
        return
      }
      setIsStreamerBackgroundUploading(true)
      try {
        const background = await uploadStreamerBackground(token, file)
        const next = normalizeStreamerBackgrounds([...streamerBackgrounds, background])
        setStreamerBackgrounds((items) => {
          writeLocalStreamerBackgrounds(next)
          return next
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed'
        window.alert(message)
      } finally {
        setIsStreamerBackgroundUploading(false)
      }
    },
    [getAccessToken, handleRequireAuth, streamerBackgrounds, writeLocalStreamerBackgrounds],
  )

  const handleDeleteStreamerBackground = useCallback(
    async (id: string) => {
      const token = await getAccessToken()
      if (!token) return
      if (id.startsWith('local:')) {
        setStreamerBackgrounds((items) => {
          const next = normalizeStreamerBackgrounds(items.filter((item) => item.id !== id))
          writeLocalStreamerBackgrounds(next)
          return next
        })
        setBackgroundRotationIndex(0)
        return
      }
      try {
        await deleteStreamerBackground(token, id)
        setStreamerBackgrounds((items) => {
          const next = normalizeStreamerBackgrounds(items.filter((item) => item.id !== id))
          writeLocalStreamerBackgrounds(next)
          return next
        })
        setBackgroundRotationIndex(0)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Delete failed'
        if (isMissingStreamerTablesError(message)) {
          setStreamerBackgrounds((items) => {
            const next = normalizeStreamerBackgrounds(items.filter((item) => item.id !== id))
            writeLocalStreamerBackgrounds(next)
            return next
          })
          setBackgroundRotationIndex(0)
          return
        }
        window.alert(message)
      }
    },
    [getAccessToken, writeLocalStreamerBackgrounds],
  )

  const isWorldInStreamerRotation = useCallback(
    (world: PublicGeneratedWorld) => selectedRotationWorldIds.includes(world.id),
    [selectedRotationWorldIds],
  )

  const handleToggleWorldInStreamerRotation = useCallback(
    async (world: PublicGeneratedWorld) => {
      if (!hasCreatorTools) {
        window.alert('此功能需要 Streamer 權限。')
        return
      }
      const token = await getAccessToken()
      if (!token) {
        await handleRequireAuth()
        return
      }

      const worldImageUrl = world.backgroundImage.trim()
      const existingItems = streamerBackgrounds.filter((item) => item.public_url === worldImageUrl)
      const currentSelectedIds = selectedRotationWorldIdsRef.current
      const toggledOff = currentSelectedIds.includes(world.id)
      const nextSelectedIds = toggledOff
        ? normalizeRotationWorldIds(currentSelectedIds.filter((id) => id !== world.id))
        : normalizeRotationWorldIds([...currentSelectedIds, world.id])

      if (!toggledOff && currentSelectedIds.length >= STREAMER_ROTATION_MAX) {
        window.alert(`我的圖已勾選 ${STREAMER_ROTATION_MAX} 張輪播圖，請先取消一張再加入。`)
        return
      }

      selectedRotationWorldIdsRef.current = nextSelectedIds
      setSelectedRotationWorldIds(nextSelectedIds)
      writeStoredRotationWorldIds(nextSelectedIds)

      if (toggledOff) {
        setStreamerBackgrounds((items) => {
          const next = normalizeStreamerBackgrounds(
            items.filter((item) => item.public_url !== worldImageUrl),
          )
          writeLocalStreamerBackgrounds(next)
          return next
        })
        setBackgroundRotationIndex((index) => {
          if (nextSelectedIds.length <= 0) return 0
          return Math.min(index, nextSelectedIds.length - 1)
        })
        setManualPreviewActive(false)

        void Promise.allSettled(
          existingItems
            .filter((item) => !item.id.startsWith('local:') && !item.id.startsWith('world:'))
            .map((item) => deleteStreamerBackground(token, item.id)),
        )
        return
      }

      try {
        const background = await addGeneratedStreamerBackground(token, worldImageUrl)
        const next = normalizeStreamerBackgrounds([...rotationBackgrounds, background])
        setStreamerBackgrounds((items) => {
          writeLocalStreamerBackgrounds(next)
          return next
        })
        setBackgroundRotationIndex(Math.max(0, nextSelectedIds.length - 1))
        setManualPreviewActive(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : '加入輪播失敗'
        if (message.toLowerCase().includes('maximum') && message.includes(String(STREAMER_ROTATION_MAX))) {
          setBackgroundRotationIndex(Math.max(0, nextSelectedIds.length - 1))
          setManualPreviewActive(false)
          return
        }
        if (isMissingStreamerTablesError(message)) {
          const localAdded = {
            id: `local:${crypto.randomUUID()}`,
            public_url: worldImageUrl,
            sort_order: rotationBackgrounds.length,
          }
          const next = normalizeStreamerBackgrounds([
            ...rotationBackgrounds,
            localAdded,
          ])
          setStreamerBackgrounds((items) => {
            writeLocalStreamerBackgrounds(next)
            return next
          })
          setBackgroundRotationIndex(Math.max(0, nextSelectedIds.length - 1))
          setManualPreviewActive(false)
          return
        }
        window.alert(message)
      }
    },
    [
      getAccessToken,
      handleRequireAuth,
      hasCreatorTools,
      rotationBackgrounds,
      selectedRotationWorldIds,
      streamerBackgrounds,
      writeLocalStreamerBackgrounds,
    ],
  )

  const handleStreamerRotationChange = useCallback(
    async (minutes: 5 | 10) => {
      const token = await getAccessToken()
      if (!token) return
      const nextSettings = { ...streamerSettings, backgroundRotationMinutes: minutes }
      setStreamerSettings(nextSettings)
      try {
        await saveStreamerSettings(token, nextSettings)
      } catch (error) {
        setStreamerSettings(streamerSettings)
        const message = error instanceof Error ? error.message : 'Save failed'
        window.alert(message)
      }
    },
    [getAccessToken, streamerSettings],
  )

  const handleDownload = useCallback(async () => {
    if (!userProfile?.hasDownloadAccess) {
      window.alert('下載功能僅限 VIP / Streamer Pass 會員使用，請先升級。')
      return
    }

    const imageUrl = activeBackgroundImage
    if (!imageUrl) return

    const accessToken = await getAccessToken()
    if (!accessToken) {
      await handleRequireAuth()
      return
    }

    try {
      const blob = await downloadBackgroundImage(
        accessToken,
        imageUrl,
        `timeloop-${activeWorldId ?? currentWorldId}.jpg`,
      )
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
  }, [
    activeBackgroundImage,
    activeWorldId,
    currentWorldId,
    getAccessToken,
    handleRequireAuth,
    userProfile?.hasDownloadAccess,
  ])

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
      primeStreamAudio(buildStreamPlaybackUrl(initial, resolveInitialProxyTier()), musicVolume)
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
      setManualPreviewActive(true)
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
      setManualPreviewActive(true)
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
        setSavedWorlds((worlds) =>
          worlds.map((world) =>
            world.id === worldId
              ? {
                  ...world,
                  isPrivate: !isPublic,
                  publishedAt: isPublic ? new Date().toISOString() : null,
                }
              : world,
          ),
        )
        setCommunityRefreshKey((key) => key + 1)
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
        setManualPreviewActive(true)
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
    [
      authUser,
      handleRequireAuth,
      refreshAccountData,
      selectedVisualEffect,
      supabase,
    ],
  )

  const collapseSidePanels = useCallback(() => {
    setLeftPanelExpanded(false)
    setRightPanelExpanded(false)
    setLeftDrawerOpen(false)
    setRightDrawerOpen(false)
  }, [])

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

    const handleDoubleClick = (e: MouseEvent) => {
      const windowWidth = window.innerWidth
      const mouseX = e.clientX
      const leftThreshold = windowWidth / 3
      const rightThreshold = (windowWidth * 2) / 3
      if (mouseX >= leftThreshold && mouseX <= rightThreshold) {
        collapseSidePanels()
      }
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)')
    if (mediaQuery.matches) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    window.addEventListener('dblclick', handleDoubleClick)

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
      window.removeEventListener('dblclick', handleDoubleClick)
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [collapseSidePanels])

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
    if (!showCockpit || !music.primaryMood || !aiDj.voiceEnabled) return

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
    aiDj.voiceEnabled,
    isBusy,
    music.currentStation?.name,
    music.primaryMood,
    showCockpit,
    speakLine,
  ])

  const streamerQuota = {
    total: userProfile?.streamerMonthlyQuotaImages ?? 300,
    used: userProfile?.streamerUsedImages ?? 0,
    remaining: userProfile?.streamerRemainingImages ?? (userProfile?.streamerMonthlyQuotaImages ?? 300),
  }

  const streamLiveReadiness = useMemo(() => {
    const rotationCount = rotationWorlds.length
    const musicReady = music.musicOnboarded && Boolean(music.currentStation || music.primaryMood)
    const imagesReady = rotationCount > 0
    const musicLabel =
      music.currentStation?.name ??
      (music.primaryMood ? getDjPersonaName(music.primaryMood) : null) ??
      '—'
    return {
      rotationCount,
      musicReady,
      imagesReady,
      ready: imagesReady && musicReady,
      musicLabel,
    }
  }, [
    getDjPersonaName,
    music.currentStation,
    music.musicOnboarded,
    music.primaryMood,
    rotationWorlds.length,
  ])

  const handleOneClickLiveStream = useCallback(() => {
    const st = translations[language].streamerOverlay

    if (!hasCreatorTools) {
      window.alert(st.previewUpgrade)
      return
    }

    if (!streamLiveReadiness.imagesReady) {
      window.alert(st.oneClickLiveNeedImages)
      return
    }

    if (!streamLiveReadiness.musicReady) {
      window.alert(st.oneClickLiveNeedMusic)
      return
    }

    setIsAudioUnlocked(true)
    setIsMusicPlaying(true)
    if (music.activeMusicStreamUrl) {
      primeStreamAudio(music.activeMusicStreamUrl, musicVolume)
    }

    const streamUrl = buildStreamModeUrl()
    const popout = openStreamModePopout(streamUrl)
    markStreamerLiveLaunchedToday()
    setStreamerLiveLaunchedToday(true)

    if (!popout) {
      window.alert(`${st.oneClickLivePopoutBlocked}\n\n${streamUrl}`)
    }
  }, [
    hasCreatorTools,
    language,
    music.activeMusicStreamUrl,
    musicVolume,
    streamLiveReadiness.imagesReady,
    streamLiveReadiness.musicReady,
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
    showStreamLayout,
    isStreamMode,
    isStreamer: hasCreatorTools,
    hasCreatorTools,
    streamerBackgrounds,
    isStreamerBackgroundUploading,
    streamerScenePacks,
    isScenePackGenerating,
    streamerQuota,
    streamLiveReadiness,
    streamerLiveLaunchedToday,
    handleOneClickLiveStream,
    communityRefreshKey,
    handleCreateStreamerScenePack,
    handleGenerateStreamerScenePack,
    handleActivateStreamerScenePack,
    handleDeleteStreamerScenePack,
    handleUploadStreamerBackground,
    handleDeleteStreamerBackground,
    isWorldInStreamerRotation,
    handleToggleWorldInStreamerRotation,
    handleStreamerRotationChange,
    streamerSettings,
    effectiveOverlaySettings,
    preferCreditPack,
    isCnHost,
    isClientMounted,
    isMobile,
    isMobilePortrait,
    ambientLayers,
    handleMusicPlayingChange,
    handleUnlockAudio,
    handleCompleteMusicOnboarding,
    chooseRegion,
    handleRequireAuth,
    handleSignOut,
    isSigningOut,
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
    dismissAiDj,
  }
}
