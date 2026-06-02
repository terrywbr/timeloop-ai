import { NextResponse } from 'next/server'
import {
  getTagsForMoods,
  isMusicMoodId,
  MUSIC_MOOD_BY_ID,
  pickRandomMood,
  type MusicMoodId,
} from '@/lib/music-moods'
import { fetchRandomStationByTags, reportStationClick } from '@/lib/radio-browser-server'

export const runtime = 'nodejs'

type RandomStationResponse = {
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

type ErrorResponse = {
  success: false
  error: string
}

function jsonOk(station: RandomStationResponse['station']) {
  return NextResponse.json({ success: true, station } satisfies RandomStationResponse)
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message } satisfies ErrorResponse, { status })
}

function parseMoods(raw: string | null): MusicMoodId[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(isMusicMoodId)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const moods = parseMoods(url.searchParams.get('moods'))

  if (moods.length === 0) {
    return jsonError('At least one mood is required', 400)
  }

  const tags = getTagsForMoods(moods)
  const exclude = url.searchParams.get('exclude')?.split(',').filter(Boolean) ?? []
  const picked = await fetchRandomStationByTags(tags, exclude)

  if (picked) {
    void reportStationClick(picked.stationuuid)
    const moodId = pickRandomMood(moods)
    return jsonOk({
      stationuuid: picked.stationuuid,
      name: picked.name,
      urlResolved: picked.url_resolved,
      tags: picked.tags,
      country: picked.country,
      moodId,
    })
  }

  const fallbackMood = pickRandomMood(moods)
  const fallback = MUSIC_MOOD_BY_ID[fallbackMood].defaultStation
  return jsonOk({
    stationuuid: fallback.stationuuid,
    name: fallback.name,
    urlResolved: fallback.urlResolved,
    tags: fallbackMood,
    country: '',
    moodId: fallbackMood,
  })
}
