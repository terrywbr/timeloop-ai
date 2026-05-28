import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const ALLOWED_HOSTS = new Set([
  'api.together.ai',
  'api.together.xyz',
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'tj.replicate.delivery',
])

function isAllowedHost(hostname: string) {
  if (ALLOWED_HOSTS.has(hostname)) return true
  if (hostname.endsWith('.replicate.delivery')) return true
  if (hostname.endsWith('.supabase.co')) return true
  return false
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawUrl = searchParams.get('url')

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only https URLs are allowed' }, { status: 400 })
  }

  if (!isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { Accept: 'image/*,*/*' },
      cache: 'force-cache',
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed with status ${upstream.status}` },
        { status: 502 },
      )
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy fetch failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
