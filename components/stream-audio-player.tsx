'use client'

import { useEffect, useRef } from 'react'
import { stopPrimedStreamAudio } from '@/lib/prime-stream-audio'

type StreamAudioPlayerProps = {
  streamUrl: string
  playing: boolean
  /** 0–100 */
  volume: number
  loop?: boolean
  muted?: boolean
  /** 24h stream mode: 5s stall detection, unlimited soft reconnect */
  streamMode?: boolean
  onPlaybackError?: (streamUrl: string) => void
}

const CROSSFADE_DURATION_MS = 2200
const STALL_CHECK_MS = 20000
const STREAM_STALL_CHECK_MS = 5000
const MAX_SOFT_RECONNECTS = 3
const STREAM_CACHE_BUST_AFTER = 4
const STREAM_FAILURE_AFTER = 12
const SOFT_RECONNECT_DELAY_MS = 800
const STREAM_MAX_RECONNECT_DELAY_MS = 30000

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const toAudioVolume = (volume: number) => clamp01(volume / 100)
const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress

export default function StreamAudioPlayer({
  streamUrl,
  playing,
  volume,
  loop = false,
  muted = false,
  streamMode = false,
  onPlaybackError,
}: StreamAudioPlayerProps) {
  const primaryAudioRef = useRef<HTMLAudioElement>(null)
  const secondaryAudioRef = useRef<HTMLAudioElement>(null)
  const activeIndexRef = useRef(0)
  const currentStreamUrlRef = useRef('')
  const targetVolumeRef = useRef(toAudioVolume(volume))
  const playingRef = useRef(playing)
  const mutedRef = useRef(muted)
  const animationFrameRef = useRef<number | null>(null)
  const stallTimerRef = useRef<number | null>(null)
  const softReconnectTimerRef = useRef<number | null>(null)
  const softReconnectCountRef = useRef(0)
  const lastProgressAtRef = useRef(0)
  const streamModeRef = useRef(streamMode)
  const onPlaybackErrorRef = useRef(onPlaybackError)

  useEffect(() => {
    streamModeRef.current = streamMode
  }, [streamMode])

  const getStallCheckMs = () => (streamModeRef.current ? STREAM_STALL_CHECK_MS : STALL_CHECK_MS)

  const getReconnectDelayMs = () => {
    if (!streamModeRef.current) return SOFT_RECONNECT_DELAY_MS
    const attempt = softReconnectCountRef.current
    return Math.min(STREAM_MAX_RECONNECT_DELAY_MS, SOFT_RECONNECT_DELAY_MS * 2 ** Math.min(attempt, 5))
  }

  const withCacheBust = (url: string) => {
    if (!streamModeRef.current || softReconnectCountRef.current < STREAM_CACHE_BUST_AFTER) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}t=${Date.now()}`
  }

  useEffect(() => {
    onPlaybackErrorRef.current = onPlaybackError
  }, [onPlaybackError])

  const getAudio = (index: number) => (index === 0 ? primaryAudioRef.current : secondaryAudioRef.current)

  const clearStallTimer = () => {
    if (stallTimerRef.current !== null) {
      window.clearTimeout(stallTimerRef.current)
      stallTimerRef.current = null
    }
  }

  const clearSoftReconnectTimer = () => {
    if (softReconnectTimerRef.current !== null) {
      window.clearTimeout(softReconnectTimerRef.current)
      softReconnectTimerRef.current = null
    }
  }

  const reportFailure = (url: string) => {
    softReconnectCountRef.current = 0
    onPlaybackErrorRef.current?.(url)
  }

  const markProgress = () => {
    lastProgressAtRef.current = Date.now()
    softReconnectCountRef.current = 0
  }

  const scheduleStallCheck = (url: string, audio: HTMLAudioElement) => {
    clearStallTimer()
    if (!playingRef.current || !url) return

    stallTimerRef.current = window.setTimeout(() => {
      if (currentStreamUrlRef.current !== url) return

      const stallMs = getStallCheckMs()
      const silentTooLong = Date.now() - lastProgressAtRef.current > stallMs - 2000
      const stuck =
        audio.error !== null ||
        (playingRef.current && !mutedRef.current && (audio.paused || silentTooLong))

      if (stuck) {
        attemptSoftReconnect(url, audio)
      } else {
        scheduleStallCheck(url, audio)
      }
    }, getStallCheckMs())
  }

  const attemptSoftReconnect = (url: string, audio: HTMLAudioElement) => {
    if (!playingRef.current || currentStreamUrlRef.current !== url) return

    const isStream = streamModeRef.current
    if (!isStream && softReconnectCountRef.current >= MAX_SOFT_RECONNECTS) {
      reportFailure(url)
      return
    }
    if (isStream && softReconnectCountRef.current >= STREAM_FAILURE_AFTER) {
      reportFailure(url)
      return
    }

    softReconnectCountRef.current += 1
    clearStallTimer()
    clearSoftReconnectTimer()

    const reconnectUrl = withCacheBust(url)

    softReconnectTimerRef.current = window.setTimeout(() => {
      if (currentStreamUrlRef.current !== url || !playingRef.current) return

      audio.volume = activeIndexRef.current === (audio === primaryAudioRef.current ? 0 : 1)
        ? targetVolumeRef.current
        : 0
      audio.muted = mutedRef.current
      audio.src = reconnectUrl
      audio.load()

      void audio
        .play()
        .then(() => {
          stopPrimedStreamAudio()
          markProgress()
          scheduleStallCheck(url, audio)
        })
        .catch(() => {
          attemptSoftReconnect(url, audio)
        })
    }, getReconnectDelayMs())
  }

  const stopFade = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const fadeVolumes = (
    primaryTarget: number,
    secondaryTarget: number,
    durationMs: number,
    onComplete?: () => void,
  ) => {
    const primary = primaryAudioRef.current
    const secondary = secondaryAudioRef.current
    if (!primary || !secondary) return

    stopFade()

    const startTime = performance.now()
    const primaryStart = primary.volume
    const secondaryStart = secondary.volume

    const step = (now: number) => {
      const progress = clamp01((now - startTime) / durationMs)
      primary.volume = lerp(primaryStart, primaryTarget, progress)
      secondary.volume = lerp(secondaryStart, secondaryTarget, progress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step)
        return
      }

      animationFrameRef.current = null
      onComplete?.()
    }

    animationFrameRef.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    targetVolumeRef.current = toAudioVolume(volume)
    if (!playingRef.current) return

    const activeAudio = getAudio(activeIndexRef.current)
    if (activeAudio) {
      activeAudio.volume = targetVolumeRef.current
    }
  }, [volume])

  useEffect(() => {
    mutedRef.current = muted
    const primary = primaryAudioRef.current
    const secondary = secondaryAudioRef.current
    if (!primary || !secondary) return

    primary.muted = muted
    secondary.muted = muted

    if (!muted && playingRef.current) {
      const activeAudio = getAudio(activeIndexRef.current)
      void activeAudio?.play().catch(() => {})
    }
  }, [muted])

  useEffect(() => {
    const primary = primaryAudioRef.current
    const secondary = secondaryAudioRef.current
    if (!primary || !secondary) return

    const handleError = (event: Event) => {
      const target = event.currentTarget as HTMLAudioElement
      const url = target.dataset.streamUrl ?? currentStreamUrlRef.current
      if (url) attemptSoftReconnect(url, target)
    }

    const handleStreamInterrupt = (event: Event) => {
      const target = event.currentTarget as HTMLAudioElement
      const url = target.dataset.streamUrl ?? currentStreamUrlRef.current
      if (!url || !playingRef.current) return
      if (target !== getAudio(activeIndexRef.current)) return
      if (Date.now() - lastProgressAtRef.current < 8000) return
      attemptSoftReconnect(url, target)
    }

    const handleTimeUpdate = (event: Event) => {
      const target = event.currentTarget as HTMLAudioElement
      if (target !== getAudio(activeIndexRef.current)) return
      markProgress()
    }

    for (const audio of [primary, secondary]) {
      audio.addEventListener('error', handleError)
      audio.addEventListener('stalled', handleStreamInterrupt)
      audio.addEventListener('waiting', handleStreamInterrupt)
      audio.addEventListener('ended', handleStreamInterrupt)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('playing', markProgress)
    }

    return () => {
      for (const audio of [primary, secondary]) {
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('stalled', handleStreamInterrupt)
        audio.removeEventListener('waiting', handleStreamInterrupt)
        audio.removeEventListener('ended', handleStreamInterrupt)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('playing', markProgress)
      }
    }
  }, [])

  useEffect(() => {
    const primary = primaryAudioRef.current
    const secondary = secondaryAudioRef.current
    if (!primary || !secondary) return

    if (!streamUrl) {
      currentStreamUrlRef.current = ''
      clearStallTimer()
      clearSoftReconnectTimer()
      softReconnectCountRef.current = 0
      stopFade()
      primary.pause()
      secondary.pause()
      primary.removeAttribute('src')
      secondary.removeAttribute('src')
      primary.load()
      secondary.load()
      return
    }

    if (currentStreamUrlRef.current === streamUrl) return

    const previousIndex = activeIndexRef.current
    const nextIndex = previousIndex === 0 ? 1 : 0
    const previousAudio = getAudio(previousIndex)
    const nextAudio = getAudio(nextIndex)
    if (!previousAudio || !nextAudio) return

    currentStreamUrlRef.current = streamUrl
    softReconnectCountRef.current = 0
    lastProgressAtRef.current = Date.now()
    nextAudio.dataset.streamUrl = streamUrl
    nextAudio.src = streamUrl
    nextAudio.load()
    nextAudio.volume = 0
    nextAudio.muted = mutedRef.current

    if (!playingRef.current) {
      previousAudio.pause()
      activeIndexRef.current = nextIndex
      return
    }

    void nextAudio
      .play()
      .then(() => {
        stopPrimedStreamAudio()
        markProgress()
        scheduleStallCheck(streamUrl, nextAudio)
      })
      .catch(() => {
        reportFailure(streamUrl)
      })
    fadeVolumes(
      nextIndex === 0 ? targetVolumeRef.current : 0,
      nextIndex === 1 ? targetVolumeRef.current : 0,
      CROSSFADE_DURATION_MS,
      () => {
        previousAudio.pause()
        previousAudio.removeAttribute('src')
        previousAudio.load()
        activeIndexRef.current = nextIndex
      },
    )
  }, [streamUrl])

  useEffect(() => {
    if (playingRef.current === playing) return
    playingRef.current = playing
    const activeAudio = getAudio(activeIndexRef.current)
    if (!activeAudio || !currentStreamUrlRef.current) return

    if (playing) {
      activeAudio.muted = mutedRef.current
      void activeAudio
        .play()
        .then(() => {
          stopPrimedStreamAudio()
          markProgress()
          scheduleStallCheck(currentStreamUrlRef.current, activeAudio)
        })
        .catch(() => {
          reportFailure(currentStreamUrlRef.current)
        })
      fadeVolumes(
        activeIndexRef.current === 0 ? targetVolumeRef.current : 0,
        activeIndexRef.current === 1 ? targetVolumeRef.current : 0,
        CROSSFADE_DURATION_MS,
      )
    } else {
      clearStallTimer()
      clearSoftReconnectTimer()
      fadeVolumes(0, 0, CROSSFADE_DURATION_MS, () => {
        primaryAudioRef.current?.pause()
        secondaryAudioRef.current?.pause()
      })
    }
  }, [playing])

  useEffect(() => {
    const tryPlay = () => {
      if (!playing || !streamUrl) return
      const activeAudio = getAudio(activeIndexRef.current)
      if (!activeAudio) return
      activeAudio.muted = mutedRef.current
      void activeAudio
        .play()
        .then(() => {
          stopPrimedStreamAudio()
          markProgress()
        })
        .catch(() => {})
    }

    document.addEventListener('pointerdown', tryPlay, { passive: true })
    document.addEventListener('touchend', tryPlay, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', tryPlay)
      document.removeEventListener('touchend', tryPlay)
    }
  }, [playing, streamUrl])

  useEffect(() => {
    return () => {
      stopFade()
      clearStallTimer()
      clearSoftReconnectTimer()
    }
  }, [])

  return (
    <>
      <audio
        ref={primaryAudioRef}
        className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
        aria-hidden
        loop={loop}
        muted={muted}
        playsInline
        preload="auto"
      />
      <audio
        ref={secondaryAudioRef}
        className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
        aria-hidden
        loop={loop}
        muted={muted}
        playsInline
        preload="auto"
      />
    </>
  )
}
