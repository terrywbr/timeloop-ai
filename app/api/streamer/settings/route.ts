import { NextResponse } from 'next/server'
import {
  hasCreatorToolsAccess,
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
} from '@/lib/supabase-server'
import { DEFAULT_STREAMER_SETTINGS, normalizeStreamerSettings } from '@/lib/streamer-settings'

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

    const { data } = await supabase
      .from('streamer_settings')
      .select('overlay, background_rotation_minutes')
      .eq('user_id', auth.user.id)
      .maybeSingle<{ overlay: Record<string, unknown>; background_rotation_minutes: number }>()

    const settings = normalizeStreamerSettings(
      data
        ? {
            overlay: data.overlay as never,
            backgroundRotationMinutes: data.background_rotation_minutes === 10 ? 10 : 5,
          }
        : DEFAULT_STREAMER_SETTINGS,
    )

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown settings error'
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

    const payloadWithUpdatedAt = {
      user_id: auth.user.id,
      overlay: settings.overlay,
      background_rotation_minutes: settings.backgroundRotationMinutes,
      updated_at: new Date().toISOString(),
    }
    let { error } = await supabase
      .from('streamer_settings')
      .upsert(payloadWithUpdatedAt, { onConflict: 'user_id' })

    // Backward compatibility: some old streamer_settings tables may not have updated_at.
    if (error && String(error.message).includes('updated_at')) {
      const fallback = await supabase.from('streamer_settings').upsert(
        {
          user_id: auth.user.id,
          overlay: settings.overlay,
          background_rotation_minutes: settings.backgroundRotationMinutes,
        },
        { onConflict: 'user_id' },
      )
      error = fallback.error
    }

    if (error) throw error

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown settings error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
