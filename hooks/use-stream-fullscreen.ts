'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getFullscreenElement,
  requestAppFullscreen,
  subscribeFullscreenChange,
} from '@/lib/fullscreen'

export function useStreamFullscreen(enabled: boolean) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTapPrompt, setShowTapPrompt] = useState(false)

  const syncState = useCallback(() => {
    const active = Boolean(getFullscreenElement())
    setIsFullscreen(active)
    setShowTapPrompt(enabled && !active)
  }, [enabled])

  const enterFullscreen = useCallback(async () => {
    if (!enabled) return
    await requestAppFullscreen()
    syncState()
  }, [enabled, syncState])

  useEffect(() => {
    if (!enabled) {
      setShowTapPrompt(false)
      return undefined
    }

    syncState()
    const unsubscribe = subscribeFullscreenChange(syncState)

    // Browsers block fullscreen without a gesture — prompt user to tap.
    const timer = window.setTimeout(() => {
      if (!getFullscreenElement()) setShowTapPrompt(true)
    }, 400)

    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [enabled, syncState])

  useEffect(() => {
    if (!enabled || !showTapPrompt) return undefined

    const onPointerDown = () => {
      void enterFullscreen()
    }

    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [enabled, enterFullscreen, showTapPrompt])

  return {
    isFullscreen,
    showTapPrompt,
    enterFullscreen,
  }
}
