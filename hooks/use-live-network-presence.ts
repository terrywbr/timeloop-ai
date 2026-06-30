'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  leaveLiveNetworkViewerHeartbeat,
  leaveStreamerLiveHeartbeat,
  sendLiveNetworkViewerHeartbeat,
  sendStreamerLiveHeartbeat,
} from '@/lib/api-client'
import { LIVE_NETWORK_HEARTBEAT_MS } from '@/lib/live-network-constants'
import { getOrCreateFocusGuestId } from '@/lib/focus-guest-id'
import { readStreamHostUserIdFromWindow } from '@/lib/stream-mode'

type UseLiveNetworkPresenceOptions = {
  /** Active ?stream=1 layout. */
  enabled: boolean
  isStreamer: boolean
  accessToken: string | null
  authUserId: string | null
  roomName: string
  roomSubtitle: string
}

export function useLiveNetworkPresence({
  enabled,
  isStreamer,
  accessToken,
  authUserId,
  roomName,
  roomSubtitle,
}: UseLiveNetworkPresenceOptions) {
  const guestIdRef = useRef<string | null>(null)
  const hostStreamerIdRef = useRef<string | null>(null)

  const resolveHostStreamerId = useCallback(() => {
    return readStreamHostUserIdFromWindow()
  }, [])

  const sendStreamerPing = useCallback(async () => {
    if (!accessToken || !isStreamer) return
    await sendStreamerLiveHeartbeat(accessToken, {
      roomName,
      subtitle: roomSubtitle,
    })
  }, [accessToken, isStreamer, roomName, roomSubtitle])

  const sendViewerPing = useCallback(async () => {
    const hostStreamerId = hostStreamerIdRef.current
    if (!hostStreamerId) return
    if (authUserId && hostStreamerId === authUserId) return

    if (!guestIdRef.current) guestIdRef.current = getOrCreateFocusGuestId()
    await sendLiveNetworkViewerHeartbeat(hostStreamerId, {
      accessToken,
      guestId: guestIdRef.current,
    })
  }, [accessToken, authUserId])

  const leaveAll = useCallback(async () => {
    const hostStreamerId = hostStreamerIdRef.current

    if (accessToken && isStreamer) {
      await leaveStreamerLiveHeartbeat(accessToken).catch(() => undefined)
    }

    if (hostStreamerId && hostStreamerId !== authUserId) {
      if (!guestIdRef.current) guestIdRef.current = getOrCreateFocusGuestId()
      await leaveLiveNetworkViewerHeartbeat(hostStreamerId, {
        accessToken,
        guestId: guestIdRef.current,
      }).catch(() => undefined)
    }
  }, [accessToken, authUserId, isStreamer])

  useEffect(() => {
    if (!enabled) {
      void leaveAll()
      return undefined
    }

    hostStreamerIdRef.current = resolveHostStreamerId()

    const tick = async () => {
      hostStreamerIdRef.current = resolveHostStreamerId()
      const currentHost = hostStreamerIdRef.current

      if (isStreamer && (!currentHost || currentHost === authUserId)) {
        await sendStreamerPing()
        return
      }

      if (currentHost && currentHost !== authUserId) {
        await sendViewerPing()
      }
    }

    void tick()
    const heartbeatId = window.setInterval(() => void tick(), LIVE_NETWORK_HEARTBEAT_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void leaveAll()
      else void tick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(heartbeatId)
      document.removeEventListener('visibilitychange', onVisibility)
      void leaveAll()
    }
  }, [
    authUserId,
    enabled,
    isStreamer,
    leaveAll,
    resolveHostStreamerId,
    sendStreamerPing,
    sendViewerPing,
  ])

  return { isOwnBroadcast: isStreamer && !resolveHostStreamerId() }
}