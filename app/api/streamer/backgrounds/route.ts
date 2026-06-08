import { NextResponse } from 'next/server'
import {
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasStreamerAccess,
} from '@/lib/supabase-server'

export const runtime = 'nodejs'

const MAX_BACKGROUNDS = 10
const BUCKET = 'streamer-backgrounds'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)

    const { data } = await supabase
      .from('streamer_backgrounds')
      .select('id, public_url, sort_order, source, created_at')
      .eq('user_id', auth.user.id)
      .order('sort_order', { ascending: true })

    return NextResponse.json({
      success: true,
      backgrounds: data ?? [],
      isStreamer: hasStreamerAccess(profile),
      maxBackgrounds: MAX_BACKGROUNDS,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown backgrounds error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)

    if (!hasStreamerAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return jsonError('file is required', 400)
    if (!file.type.startsWith('image/')) return jsonError('Only image uploads are allowed', 400)
    if (file.size > 8 * 1024 * 1024) return jsonError('Image must be under 8MB', 400)

    const { count } = await supabase
      .from('streamer_backgrounds')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)

    if ((count ?? 0) >= MAX_BACKGROUNDS) {
      return jsonError(`Maximum ${MAX_BACKGROUNDS} backgrounds allowed`, 400)
    }

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) throw uploadError

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = publicData.publicUrl

    const { data: row, error } = await supabase
      .from('streamer_backgrounds')
      .insert({
        user_id: auth.user.id,
        storage_path: path,
        public_url: publicUrl,
        sort_order: count ?? 0,
        source: 'upload',
      })
      .select('id, public_url, sort_order, source, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, background: row })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    await ensureUserProfile(supabase, auth.user)

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return jsonError('id is required', 400)

    const { data: row } = await supabase
      .from('streamer_backgrounds')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle<{ storage_path: string }>()

    if (!row) return jsonError('Background not found', 404)

    await supabase.storage.from(BUCKET).remove([row.storage_path])
    await supabase.from('streamer_backgrounds').delete().eq('id', id).eq('user_id', auth.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown delete error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
