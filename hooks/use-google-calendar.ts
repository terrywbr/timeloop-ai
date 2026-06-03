'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { signInWithGoogleCalendar } from '@/lib/auth-google-calendar'
import {
  loadCalendarNotifiedIds,
  saveCalendarNotifiedIds,
} from '@/lib/companion/storage'
import type { DjSpeakContext } from '@/lib/dj-types'

export type CalendarEventItem = {
  id: string
  title: string
  start: string
  end: string
}

type UseGoogleCalendarOptions = {
  cockpitActive: boolean
  isAuthenticated: boolean
  accessToken: string | null
  onCalendarReminder: (context: DjSpeakContext) => void
  isDjBusy: () => boolean
}

export function useGoogleCalendar({
  cockpitActive,
  isAuthenticated,
  accessToken,
  onCalendarReminder,
  isDjBusy,
}: UseGoogleCalendarOptions) {
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const notifiedRef = useRef<Set<string>>(loadCalendarNotifiedIds())

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setConnected(false)
      setEvents([])
      return
    }

    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const providerToken = data.session?.provider_token

      const response = await fetch('/api/calendar/upcoming', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerToken }),
      })

      const payload = (await response.json()) as {
        success: boolean
        connected?: boolean
        events?: CalendarEventItem[]
      }

      if (payload.success && payload.connected && payload.events) {
        setConnected(true)
        setEvents(payload.events)

        const now = Date.now()
        for (const event of payload.events) {
          const startMs = new Date(event.start).getTime()
          const minutesUntil = Math.round((startMs - now) / 60000)
          if (minutesUntil < 0 || minutesUntil > 5) continue
          if (notifiedRef.current.has(event.id)) continue
          if (isDjBusy()) continue

          notifiedRef.current.add(event.id)
          saveCalendarNotifiedIds(notifiedRef.current)
          onCalendarReminder({
            eventTitle: event.title,
            minutesUntil: Math.max(1, minutesUntil),
          })
        }
      } else {
        setConnected(false)
        setEvents([])
      }
    } catch {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [accessToken, isAuthenticated, isDjBusy, onCalendarReminder])

  useEffect(() => {
    if (!cockpitActive || !isAuthenticated) return
    void fetchEvents()
    const id = window.setInterval(() => void fetchEvents(), 5 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [cockpitActive, fetchEvents, isAuthenticated])

  const connectCalendar = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      await signInWithGoogleCalendar(supabase)
    } catch (error) {
      console.warn('[calendar] connect failed:', error)
    }
  }, [])

  return {
    calendarEvents: events,
    calendarConnected: connected,
    calendarLoading: loading,
    connectCalendar,
    refreshCalendar: fetchEvents,
  }
}
