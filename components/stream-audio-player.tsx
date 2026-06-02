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
  onPlaybackError?: (streamUrl: string) => void
}

const CROSSFADE_DURATION_MS = 2200
const STALL_CHECK_MS = 12000

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const toAudioVolume = (volume: number) => clamp01(volume / 100)
const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress

export default function StreamAudioPlayer({
  streamUrl,
  playing,
  volume,
  loop = false,
  muted = false,
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
  const onPlaybackErrorRef = useRef(onPlaybackError)

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

  const reportFailure = (url: string) => {
    onPlaybackErrorRef.current?.(url)
  }

  const scheduleStallCheck = (url: string, audio: HTMLAudioElement) => {
    clearStallTimer()
    if (!playingRef.current || !url) return

    stallTimerRef.current = window.setTimeout(() => {
      if (currentStreamUrlRef.current !== url) return
      const stuck =
        audio.paused ||
        audio.error !== null ||
        (audio.readyState >= 2 && audio.currentTime < 0.5)
      if (stuck) {
        reportFailure(url)
      }
    }, STALL_CHECK_MS)
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
      if (url) reportFailure(url)
    }

    primary.addEventListener('error', handleError)
    secondary.addEventListener('error', handleError)
    return () => {
      primary.removeEventListener('error', handleError)
      secondary.removeEventListener('error', handleError)
    }
  }, [])

  useEffect(() => {
    const primary = primaryAudioRef.current
    const secondary = secondaryAudioRef.current
    if (!primary || !secondary) return

    if (!streamUrl) {
      currentStreamUrlRef.current = ''
      clearStallTimer()
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
        preload="none"
      />
      <audio
        ref={secondaryAudioRef}
        className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
        aria-hidden
        loop={loop}
        muted={muted}
        playsInline
        preload="none"
      />
    </>
  )
}
