import { NextResponse } from 'next/server'
import {
  hasCreatorToolsAccess,
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
} from '@/lib/supabase-server'
import { DEFAULT_STREAMER_SETTINGS, normalizeStreamerSettings } from '@/lib/streamer-settings'
import { isMissingStreamerTableError, toErrorMessage } from '@/lib/streamer-db-errors'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const { data, error: selectError } = await supabase
      .from('streamer_settings')
      .select('background_rotation_minutes')
      .eq('user_id', auth.user.id)
      .maybeSingle<{ background_rotation_minutes: number }>()

    if (selectError) {
      const message = toErrorMessage(selectError)
      if (isMissingStreamerTableError(message)) {
        return NextResponse.json({
          success: true,
          settings: DEFAULT_STREAMER_SETTINGS,
          persisted: false,
        })
      }
      throw selectError
    }

    const settings = normalizeStreamerSettings({
      backgroundRotationMinutes: data?.background_rotation_minutes === 10 ? 10 : 5,
    })

    return NextResponse.json({ success: true, settings, persisted: true })
  } catch (error) {
    const message = toErrorMessage(error)
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)

    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const body = (await req.json()) as Partial<typeof DEFAULT_STREAMER_SETTINGS>
    const settings = normalizeStreamerSettings(body)

    const { data: existing } = await supabase
      .from('streamer_settings')
      .select('overlay')
      .eq('user_id', auth.user.id)
      .maybeSingle<{ overlay: Record<string, unknown> | null }>()

    const basePayload = {
      user_id: auth.user.id,
      overlay: existing?.overlay ?? {},
      background_rotation_minutes: settings.backgroundRotationMinutes,
    }

    const attempts = [
      { ...basePayload, updated_at: new Date().toISOString() },
      basePayload,
    ]

    let lastError: unknown = null
    for (const payload of attempts) {
      const { error } = await supabase
        .from('streamer_settings')
        .upsert(payload, { onConflict: 'user_id' })
      if (!error) {
        return NextResponse.json({ success: true, settings, persisted: true })
      }
      lastError = error
      const message = toErrorMessage(error)
      if (isMissingStreamerTableError(message)) {
        return NextResponse.json({ success: true, settings, persisted: false })
      }
      if (!message.includes('updated_at')) break
    }

    if (lastError) throw lastError

    return NextResponse.json({ success: true, settings, persisted: true })
  } catch (error) {
    const message = toErrorMessage(error)
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
