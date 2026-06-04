'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MusicMoodId } from '@/lib/music-moods'
import { MUSIC_MOOD_IDS } from '@/lib/music-moods'
import {
  buildStreamPlaybackUrl,
  defaultStationForMood,
  isDefaultStation,
  isExternalProxyUrl,
  isMusicOnboarded,
  isStreamUrlForStation,
  loadFavoriteStations,
  loadSelectedMoods,
  markMusicOnboarded,
  pickInitialStation,
  resolveInitialProxyTier,
  saveFavoriteStations,
  saveSelectedMoods,
  shouldPreferStreamProxy,
  toggleFavoriteStation,
  toRadioStation,
  type RadioStation,
  type StreamProxyTier,
} from '@/lib/radio-station'
import { GEO_UPDATED_EVENT } from '@/lib/geo-region'
import { loadPrimaryMood, savePrimaryMood } from '@/lib/dj-settings'
import { WORLD_MUSIC_MOODS } from '@/lib/worlds'
import type { AmbientWorldId } from '@/lib/ambient-worlds'

type RandomStationApiResponse =
  | {
      success: true
      station: {
        stationuuid: string
        name: string
        urlResolved: string
        tags: string
        country: string
        moodId?: MusicMoodId
      }
    }
  | { success: false; error: string }

export function useMusicStation() {
  const [musicOnboarded, setMusicOnboarded] = useState(() =>
    typeof window !== 'undefined' ? isMusicOnboarded() : false,
  )
  const [selectedMoods, setSelectedMoods] = useState<MusicMoodId[]>([])
  const [primaryMood, setPrimaryMoodState] = useState<MusicMoodId | null>(null)
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null)
  const [favoriteStations, setFavoriteStations] = useState<RadioStation[]>([])
  const [isStationLoading, setIsStationLoading] = useState(false)
  const [tunerStation, setTunerStation] = useState<RadioStation | null>(null)
  const historyRef = useRef<RadioStation[]>([])
  const historyIndexRef = useRef(-1)
  const failedStationIdsRef = useRef<Set<string>>(new Set())
  const fallbackInProgressRef = useRef(false)
  const currentStationRef = useRef<RadioStation | null>(null)
  const [streamProxyTier, setStreamProxyTier] = useState<StreamProxyTier>(() =>
    typeof window !== 'undefined' ? resolveInitialProxyTier() : 'direct',
  )

  const syncProxyTier = useCallback(() => {
    setStreamProxyTier(shouldPreferStreamProxy() ? 'external' : 'direct')
  }, [])

  useEffect(() => {
    currentStationRef.current = currentStation
    syncProxyTier()
  }, [currentStation, syncProxyTier])

  useEffect(() => {
    const onGeoUpdated = () => syncProxyTier()
    window.addEventListener(GEO_UPDATED_EVENT, onGeoUpdated)
    return () => window.removeEventListener(GEO_UPDATED_EVENT, onGeoUpdated)
  }, [syncProxyTier])

  useEffect(() => {
    setMusicOnboarded(isMusicOnboarded())
    let moods = loadSelectedMoods()
    if (isMusicOnboarded() && moods.length === 0) {
      moods = [MUSIC_MOOD_IDS[1] ?? 'deep-night']
      saveSelectedMoods(moods)
    }
    setSelectedMoods(moods)
    const storedPrimary = loadPrimaryMood()
    const primary = storedPrimary && moods.includes(storedPrimary) ? storedPrimary : moods[0] ?? null
    setPrimaryMoodState(primary)
    setFavoriteStations(loadFavoriteStations())
    if (isMusicOnboarded() && moods.length > 0) {
      const initial = pickInitialStation(moods)
      setCurrentStation(initial)
      historyRef.current = [initial]
      historyIndexRef.current = 0
    }
  }, [])

  const pushHistory = useCallback((station: RadioStation) => {
    const history = historyRef.current.slice(0, historyIndexRef.current + 1)
    history.push(station)
    historyRef.current = history.slice(-30)
    historyIndexRef.current = historyRef.current.length - 1
  }, [])

  const showTuner = useCallback((station: RadioStation) => {
    setTunerStation(station)
    window.setTimeout(() => setTunerStation(null), 3500)
  }, [])

  const applyStation = useCallback(
    (station: RadioStation, options?: { showTuner?: boolean; pushHistory?: boolean }) => {
      setCurrentStation(station)
      if (options?.pushHistory !== false) {
        pushHistory(station)
      }
      if (options?.showTuner) {
        showTuner(station)
      }
    },
    [pushHistory, showTuner],
  )

  const fetchRandomStation = useCallback(async (moods: MusicMoodId[], excludeUuids: string[] = []) => {
    if (moods.length === 0) return null

    setIsStationLoading(true)
    try {
      const excludeParam =
        excludeUuids.length > 0 ? `&exclude=${encodeURIComponent(excludeUuids.join(','))}` : ''
      const response = await fetch(
        `/api/radio/random?moods=${encodeURIComponent(moods.join(','))}${excludeParam}`,
      )
      const data = (await response.json()) as RandomStationApiResponse
      if (!response.ok || !data.success) {
        const fallbackMood = moods[0]
        return defaultStationForMood(fallbackMood)
      }
      return toRadioStation({
        stationuuid: data.station.stationuuid,
        name: data.station.name,
        urlResolved: data.station.urlResolved,
        moodId: data.station.moodId,
        tags: data.station.tags,
        country: data.station.country,
      })
    } catch {
      return defaultStationForMood(moods[0])
    } finally {
      setIsStationLoading(false)
    }
  }, [])

  const setPrimaryMood = useCallback((moodId: MusicMoodId) => {
    savePrimaryMood(moodId)
    setPrimaryMoodState(moodId)
  }, [])

  const completeMusicOnboarding = useCallback(
    (moods: MusicMoodId[]) => {
      saveSelectedMoods(moods)
      markMusicOnboarded()
      setSelectedMoods(moods)
      setMusicOnboarded(true)
      const primary = moods[0] ?? 'deep-night'
      savePrimaryMood(primary)
      setPrimaryMoodState(primary)
      const initial = pickInitialStation(moods)
      historyRef.current = [initial]
      historyIndexRef.current = 0
      setCurrentStation(initial)
      return { initial, primaryMood: primary }
    },
    [],
  )

  const reopenMusicOnboarding = useCallback(() => {
    setMusicOnboarded(false)
  }, [])

  const handleNextStation = useCallback(async () => {
    const moods = selectedMoods.length > 0 ? selectedMoods : loadSelectedMoods()
    if (moods.length === 0) return

    failedStationIdsRef.current.clear()
    const station = await fetchRandomStation(moods)
    if (station) {
      applyStation(station, { showTuner: true })
    }
  }, [applyStation, fetchRandomStation, selectedMoods])

  const handleStreamFailure = useCallback(
    async (failedStreamUrl: string) => {
      if (fallbackInProgressRef.current) return

      const station = currentStationRef.current
      if (!station) return
      if (!isStreamUrlForStation(station, failedStreamUrl)) return

      fallbackInProgressRef.current = true

      try {
        if (streamProxyTier === 'direct') {
          setStreamProxyTier(shouldPreferStreamProxy() ? 'external' : 'external')
          fallbackInProgressRef.current = false
          return
        }

        if (streamProxyTier === 'external' && isExternalProxyUrl(failedStreamUrl)) {
          setStreamProxyTier('api')
          fallbackInProgressRef.current = false
          return
        }

        failedStationIdsRef.current.add(station.stationuuid)

        const moods = selectedMoods.length > 0 ? selectedMoods : loadSelectedMoods()
        const moodId = station.moodId ?? moods[0] ?? 'deep-night'

        if (!isDefaultStation(station.stationuuid)) {
          const fallback = defaultStationForMood(moodId)
          applyStation(fallback, { showTuner: true, pushHistory: false })
          return
        }

        const exclude = [...failedStationIdsRef.current]
        const next = await fetchRandomStation(moods, exclude)
        if (next) {
          applyStation(next, { showTuner: true, pushHistory: false })
          return
        }

        applyStation(defaultStationForMood(moodId), { showTuner: true, pushHistory: false })
      } finally {
        window.setTimeout(() => {
          fallbackInProgressRef.current = false
        }, 1500)
      }
    },
    [applyStation, fetchRandomStation, selectedMoods, streamProxyTier],
  )

  const handlePrevStation = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1
      const station = historyRef.current[historyIndexRef.current]
      if (station) {
        applyStation(station, { showTuner: true, pushHistory: false })
      }
      return
    }
    void handleNextStation()
  }, [applyStation, handleNextStation])

  const handlePlayFavorite = useCallback(
    (station: RadioStation) => {
      applyStation(station, { showTuner: true })
    },
    [applyStation],
  )

  const handleToggleFavorite = useCallback(() => {
    if (!currentStation) return
    setFavoriteStations((prev) => {
      const next = toggleFavoriteStation(prev, currentStation)
      saveFavoriteStations(next)
      return next
    })
  }, [currentStation])

  const handleRemoveFavorite = useCallback((stationuuid: string) => {
    setFavoriteStations((prev) => {
      const next = prev.filter((s) => s.stationuuid !== stationuuid)
      saveFavoriteStations(next)
      return next
    })
  }, [])

  const isCurrentFavorited = useMemo(() => {
    if (!currentStation) return false
    return favoriteStations.some((f) => f.stationuuid === currentStation.stationuuid)
  }, [currentStation, favoriteStations])

  const activeMusicStreamUrl = useMemo(() => {
    if (!currentStation) return ''
    return buildStreamPlaybackUrl(currentStation, streamProxyTier)
  }, [currentStation, streamProxyTier])

  const loadStationForWorld = useCallback(
    (worldId: AmbientWorldId) => {
      const moodId = WORLD_MUSIC_MOODS[worldId]
      const station = defaultStationForMood(moodId)
      applyStation(station, { showTuner: true })
    },
    [applyStation],
  )

  return {
    musicOnboarded,
    selectedMoods,
    primaryMood,
    setPrimaryMood,
    currentStation,
    favoriteStations,
    isStationLoading,
    tunerStation,
    isCurrentFavorited,
    activeMusicStreamUrl,
    completeMusicOnboarding,
    reopenMusicOnboarding,
    handleNextStation,
    handlePrevStation,
    handleStreamFailure,
    handlePlayFavorite,
    handleToggleFavorite,
    handleRemoveFavorite,
    loadStationForWorld,
    setCurrentStation: applyStation,
  }
}
