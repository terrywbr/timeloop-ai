import { NextResponse } from 'next/server'
import { MUSIC_CHANNELS, type MusicChannelKey } from '@/lib/music-channels'

export const runtime = 'nodejs'
export const maxDuration = 300

const stationUrlByKey = new Map<MusicChannelKey, string>(
  MUSIC_CHANNELS.map((channel) => [channel.key, channel.streamUrl]),
)

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function isMusicChannelKey(value: string): value is MusicChannelKey {
  return stationUrlByKey.has(value as MusicChannelKey)
}

function isAllowedStreamUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

async function proxyStream(streamUrl: string) {
  const upstream = await fetch(streamUrl, {
    headers: {
      'User-Agent': 'TimeLoopAI/1.0',
      Accept: 'audio/mpeg,audio/*,*/*',
    },
  })

  if (!upstream.ok || !upstream.body) {
    return jsonError(`Upstream stream failed with status ${upstream.status}`, 502)
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'audio/mpeg',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const station = url.searchParams.get('station')
  const streamUrlParam = url.searchParams.get('url')

  if (streamUrlParam) {
    const decoded = decodeURIComponent(streamUrlParam)
    if (!isAllowedStreamUrl(decoded)) {
      return jsonError('Invalid stream URL', 400)
    }
    return proxyStream(decoded)
  }

  if (!station || !isMusicChannelKey(station)) {
    return jsonError('Unsupported station or missing url', 400)
  }

  const streamUrl = stationUrlByKey.get(station)
  if (!streamUrl) return jsonError('Station not found', 404)

  return proxyStream(streamUrl)
}
