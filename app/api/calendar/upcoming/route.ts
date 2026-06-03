import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
}

type SuccessResponse = {
  success: true
  connected: boolean
  events: CalendarEvent[]
}

type ErrorResponse = { success: false; error: string }

function jsonOk(body: Omit<SuccessResponse, 'success'>) {
  return NextResponse.json({ success: true, ...body } satisfies SuccessResponse)
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message } satisfies ErrorResponse, { status })
}

export async function POST(req: Request) {
  let providerToken: string | undefined
  try {
    const body = (await req.json()) as { providerToken?: string }
    providerToken = body.providerToken?.trim()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  try {
    await getAuthenticatedUser(req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return jsonError(message, 401)
  }

  if (!providerToken) {
    return jsonOk({ connected: false, events: [] })
  }

  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', now.toISOString())
  url.searchParams.set('timeMax', endOfDay.toISOString())
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '10')

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${providerToken}` },
  })

  if (!response.ok) {
    console.warn('[api/calendar/upcoming] Google API error:', response.status)
    return jsonOk({ connected: false, events: [] })
  }

  const payload = (await response.json()) as {
    items?: Array<{
      id?: string
      summary?: string
      start?: { dateTime?: string; date?: string }
      end?: { dateTime?: string; date?: string }
    }>
  }

  const events: CalendarEvent[] = (payload.items ?? [])
    .filter((item) => item.id && item.summary)
    .map((item) => ({
      id: item.id!,
      title: item.summary!,
      start: item.start?.dateTime ?? item.start?.date ?? '',
      end: item.end?.dateTime ?? item.end?.date ?? '',
    }))
    .slice(0, 3)

  return jsonOk({ connected: true, events })
}
