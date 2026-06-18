import { NextResponse } from 'next/server'
import {
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasDownloadAccess,
} from '@/lib/supabase-server'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)

    if (!hasDownloadAccess(profile)) {
      return jsonError('下載功能僅限 VIP / Streamer Pass 會員。', 403)
    }

    const body = (await req.json()) as { imageUrl?: string; filename?: string }
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
    if (!imageUrl) return jsonError('imageUrl is required', 400)

    const parsed = new URL(imageUrl)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return jsonError('Invalid image URL', 400)
    }

    const upstream = await fetch(imageUrl)
    if (!upstream.ok) {
      return jsonError('Unable to fetch image', 502)
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    const buffer = Buffer.from(await upstream.arrayBuffer())
    const filename =
      typeof body.filename === 'string' && body.filename.trim().length > 0
        ? body.filename.trim()
        : 'timeloop-background.jpg'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
