/** Standalone audio stream proxy for mainland China (long-lived passthrough). */

const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map((p) => Number.parseInt(p, 10))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false
  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function isAllowedUpstreamHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(host)) return false
  if (host.endsWith('.local') || host.endsWith('.internal')) return false
  if (isPrivateIpv4(host)) return false
  return true
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        },
      })
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }

    const url = new URL(request.url)
    const upstreamRaw = url.searchParams.get('url')
    if (!upstreamRaw) return new Response('Missing url param', { status: 400 })

    let upstreamUrl: URL
    try {
      upstreamUrl = new URL(upstreamRaw)
    } catch {
      return new Response('Invalid url', { status: 400 })
    }

    if (upstreamUrl.protocol !== 'http:' && upstreamUrl.protocol !== 'https:') {
      return new Response('Invalid protocol', { status: 400 })
    }

    if (!isAllowedUpstreamHost(upstreamUrl.hostname)) {
      return new Response('Forbidden host', { status: 403 })
    }

    try {
      const upstreamRes = await fetch(upstreamUrl.toString(), {
        method: request.method,
        headers: {
          'User-Agent': 'TimeLoopAI-StreamProxy/1.0',
          Accept: 'audio/mpeg,audio/*,*/*',
        },
        redirect: 'follow',
      })

      if (!upstreamRes.ok || !upstreamRes.body) {
        return new Response('Upstream failed', { status: 502 })
      }

      const headers = new Headers(upstreamRes.headers)
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Cache-Control', 'no-store')

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers,
      })
    } catch {
      return new Response('Proxy failed', { status: 500 })
    }
  },
}
