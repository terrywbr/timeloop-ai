'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchFocusPresence,
  leaveFocusSession,
  sendFocusHeartbeat,
} from '@/lib/api-client'
import { getOrCreateFocusGuestId } from '@/lib/focus-guest-id'

const HEARTBEAT_MS = 30_000

export function useCoFocus(options: {
  worldId: string | null
  enabled: boolean
  accessToken: string | null
  cockpitActive: boolean
}) {
  const { worldId, enabled, accessToken, cockpitActive } = options
  const [presenceCount, setPresenceCount] = useState(0)
  const guestIdRef = useRef<string | null>(null)

  const refreshPresence = useCallback(async () => {
    if (!worldId || !enabled) {
      setPresenceCount(0)
      return
    }
    const count = await fetchFocusPresence(worldId)
    setPresenceCount(count)
  }, [enabled, worldId])

  const sendHeartbeat = useCallback(async () => {
    if (!worldId || !enabled || !cockpitActive) return
    if (!guestIdRef.current) guestIdRef.current = getOrCreateFocusGuestId()
    await sendFocusHeartbeat(worldId, {
      accessToken,
      guestId: guestIdRef.current,
    })
    void refreshPresence()
  }, [accessToken, cockpitActive, enabled, refreshPresence, worldId])

  const leave = useCallback(async () => {
    if (!worldId) return
    if (!guestIdRef.current) guestIdRef.current = getOrCreateFocusGuestId()
    await leaveFocusSession(worldId, {
      accessToken,
      guestId: guestIdRef.current,
    })
    setPresenceCount(0)
  }, [accessToken, worldId])

  useEffect(() => {
    if (!enabled || !worldId || !cockpitActive) {
      void leave()
      return
    }

    void sendHeartbeat()
    const heartbeatId = window.setInterval(() => void sendHeartbeat(), HEARTBEAT_MS)
    const presenceId = window.setInterval(() => void refreshPresence(), HEARTBEAT_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void leave()
      else void sendHeartbeat()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(heartbeatId)
      window.clearInterval(presenceId)
      document.removeEventListener('visibilitychange', onVisibility)
      void leave()
    }
  }, [cockpitActive, enabled, leave, refreshPresence, sendHeartbeat, worldId])

  return { presenceCount, refreshPresence }
}
