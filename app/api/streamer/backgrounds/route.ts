import { NextResponse } from 'next/server'
import {
  hasCreatorToolsAccess,
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
} from '@/lib/supabase-server'

export const runtime = 'nodejs'

const MAX_BACKGROUNDS = 20
const BUCKET = 'streamer-backgrounds'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage
    }
  }
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown upload error'
  }
}

function isBucketMissingMessage(message: string) {
  const lower = message.toLowerCase()
  return lower.includes('bucket not found') || lower.includes('not found')
}

function isMissingStreamerBackgroundsTableMessage(message: string) {
  const lower = message.toLowerCase()
  return lower.includes('public.streamer_backgrounds') && lower.includes('not find')
}

type FallbackBackgroundRow = {
  id: string
  public_url: string
  sort_order: number
  source: 'upload' | 'generated'
  created_at: string
  storage_path: string
}

function parseFallbackBackgrounds(rawOverlay: unknown): FallbackBackgroundRow[] {
  const overlay =
    rawOverlay && typeof rawOverlay === 'object' ? (rawOverlay as Record<string, unknown>) : {}
  const rawList = overlay.__rotationBackgrounds
  if (!Array.isArray(rawList)) return []

  return rawList
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map<FallbackBackgroundRow>((item, index) => ({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      public_url: typeof item.public_url === 'string' ? item.public_url : '',
      sort_order:
        typeof item.sort_order === 'number' && Number.isFinite(item.sort_order)
          ? item.sort_order
          : index,
      source: item.source === 'upload' ? 'upload' : 'generated',
      created_at:
        typeof item.created_at === 'string' && item.created_at.length > 0
          ? item.created_at
          : new Date().toISOString(),
      storage_path:
        typeof item.storage_path === 'string' && item.storage_path.length > 0
          ? item.storage_path
          : 'remote:legacy',
    }))
    .filter((item) => item.public_url.length > 0)
    .sort((a, b) => a.sort_order - b.sort_order)
}

async function readFallbackBackgrounds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
): Promise<{
  overlay: Record<string, unknown>
  backgrounds: FallbackBackgroundRow[]
  backgroundRotationMinutes: 5 | 10
}> {
  const { data, error } = await supabase
    .from('streamer_settings')
    .select('overlay, background_rotation_minutes')
    .eq('user_id', userId)
    .maybeSingle<{ overlay: Record<string, unknown> | null; background_rotation_minutes: number }>()

  if (error) throw error

  const overlay = (data?.overlay ?? {}) as Record<string, unknown>
  const backgrounds = parseFallbackBackgrounds(overlay)
  const backgroundRotationMinutes: 5 | 10 =
    data?.background_rotation_minutes === 10 || data?.background_rotation_minutes === 5
      ? data.background_rotation_minutes
      : 5

  return { overlay, backgrounds, backgroundRotationMinutes }
}

async function writeFallbackBackgrounds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  overlay: Record<string, unknown>,
  backgrounds: FallbackBackgroundRow[],
  backgroundRotationMinutes: 5 | 10,
) {
  const nextOverlay: Record<string, unknown> = {
    ...overlay,
    __rotationBackgrounds: backgrounds,
  }

  const payloadWithUpdatedAt = {
    user_id: userId,
    overlay: nextOverlay,
    background_rotation_minutes: backgroundRotationMinutes,
    updated_at: new Date().toISOString(),
  }

  let { error } = await supabase.from('streamer_settings').upsert(payloadWithUpdatedAt, {
    onConflict: 'user_id',
  })

  if (error && String(error.message).includes('updated_at')) {
    const fallback = await supabase.from('streamer_settings').upsert(
      {
        user_id: userId,
        overlay: nextOverlay,
        background_rotation_minutes: backgroundRotationMinutes,
      },
      { onConflict: 'user_id' },
    )
    error = fallback.error
  }

  if (error) throw error
}

async function ensureStreamerBackgroundBucket(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { error: getBucketError } = await supabase.storage.getBucket(BUCKET)
  if (!getBucketError) return

  if (!isBucketMissingMessage(getBucketError.message)) {
    throw getBucketError
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
  })

  if (createError && !isBucketMissingMessage(createError.message) && !createError.message.toLowerCase().includes('already')) {
    throw createError
  }

  // Ensure generated URLs are readable in the client.
  await supabase.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
  })
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const { data, error } = await supabase
      .from('streamer_backgrounds')
      .select('id, public_url, sort_order, source, created_at')
      .eq('user_id', auth.user.id)
      .order('sort_order', { ascending: true })

    if (error) {
      if (!isMissingStreamerBackgroundsTableMessage(error.message)) {
        throw error
      }
      const fallback = await readFallbackBackgrounds(supabase, auth.user.id)
      return NextResponse.json({
        success: true,
        backgrounds: fallback.backgrounds.map((item) => ({
          id: item.id,
          public_url: item.public_url,
          sort_order: item.sort_order,
          source: item.source,
          created_at: item.created_at,
        })),
        isStreamer: true,
        maxBackgrounds: MAX_BACKGROUNDS,
      })
    }

    return NextResponse.json({
      success: true,
      backgrounds: data ?? [],
      isStreamer: true,
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

    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const countResult = await supabase
      .from('streamer_backgrounds')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)
    let useFallbackStore = false
    let count = countResult.count ?? 0
    let fallbackOverlay: Record<string, unknown> = {}
    let fallbackBackgroundRotationMinutes: 5 | 10 = 5
    let fallbackBackgrounds: FallbackBackgroundRow[] = []

    if (countResult.error) {
      if (!isMissingStreamerBackgroundsTableMessage(countResult.error.message)) {
        throw countResult.error
      }
      useFallbackStore = true
      const fallback = await readFallbackBackgrounds(supabase, auth.user.id)
      fallbackOverlay = fallback.overlay
      fallbackBackgroundRotationMinutes = fallback.backgroundRotationMinutes
      fallbackBackgrounds = fallback.backgrounds
      count = fallbackBackgrounds.length
    }

    if ((count ?? 0) >= MAX_BACKGROUNDS) {
      return jsonError(`Maximum ${MAX_BACKGROUNDS} backgrounds allowed`, 400)
    }

    const contentType = req.headers.get('content-type')?.toLowerCase() ?? ''
    let fileBuffer: Buffer
    let fileType = 'image/jpeg'
    let source: 'upload' | 'generated' = 'upload'
    let generatedImageUrl: string | null = null

    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { imageUrl?: string }
      const imageUrl = body.imageUrl?.trim()
      if (!imageUrl) return jsonError('imageUrl is required', 400)
      if (!/^https?:\/\//i.test(imageUrl)) return jsonError('imageUrl must be http/https', 400)
      source = 'generated'
      generatedImageUrl = imageUrl
      fileBuffer = Buffer.alloc(0)
    } else {
      const formData = await req.formData()
      const file = formData.get('file')
      if (!(file instanceof File)) return jsonError('file is required', 400)
      if (!file.type.startsWith('image/')) return jsonError('Only image uploads are allowed', 400)
      if (file.size > 8 * 1024 * 1024) return jsonError('Image must be under 8MB', 400)
      fileBuffer = Buffer.from(await file.arrayBuffer())
      fileType = file.type
      source = 'upload'
    }

    let path: string
    let publicUrl: string

    if (source === 'generated' && generatedImageUrl) {
      // Generated worlds already have a usable URL; for rotation we can reference it directly
      // and avoid storage re-upload failures that block checkbox selection.
      path = `remote:${crypto.randomUUID()}`
      publicUrl = generatedImageUrl
    } else {
      const ext = fileType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
      path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`

      await ensureStreamerBackgroundBucket(supabase)
      let { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, fileBuffer, {
        contentType: fileType,
        upsert: false,
      })
      if (uploadError && isBucketMissingMessage(uploadError.message)) {
        await ensureStreamerBackgroundBucket(supabase)
        const retry = await supabase.storage.from(BUCKET).upload(path, fileBuffer, {
          contentType: fileType,
          upsert: false,
        })
        uploadError = retry.error
      }
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      publicUrl = publicData.publicUrl
    }

    if (useFallbackStore) {
      const nowIso = new Date().toISOString()
      const inserted: FallbackBackgroundRow = {
        id: crypto.randomUUID(),
        public_url: publicUrl,
        sort_order: count ?? 0,
        source,
        created_at: nowIso,
        storage_path: path,
      }
      const nextList = [...fallbackBackgrounds, inserted].sort((a, b) => a.sort_order - b.sort_order)
      await writeFallbackBackgrounds(
        supabase,
        auth.user.id,
        fallbackOverlay,
        nextList,
        fallbackBackgroundRotationMinutes,
      )
      return NextResponse.json({
        success: true,
        background: {
          id: inserted.id,
          public_url: inserted.public_url,
          sort_order: inserted.sort_order,
          source: inserted.source,
          created_at: inserted.created_at,
        },
      })
    }

    const insertResult = await supabase
      .from('streamer_backgrounds')
      .insert({
        user_id: auth.user.id,
        storage_path: path,
        public_url: publicUrl,
        sort_order: count ?? 0,
        source,
      })
      .select('id, public_url, sort_order, source, created_at')
      .single()

    if (insertResult.error) {
      if (!isMissingStreamerBackgroundsTableMessage(insertResult.error.message)) {
        throw insertResult.error
      }
      const fallback = await readFallbackBackgrounds(supabase, auth.user.id)
      const nowIso = new Date().toISOString()
      const inserted: FallbackBackgroundRow = {
        id: crypto.randomUUID(),
        public_url: publicUrl,
        sort_order: fallback.backgrounds.length,
        source,
        created_at: nowIso,
        storage_path: path,
      }
      const nextList = [...fallback.backgrounds, inserted].sort((a, b) => a.sort_order - b.sort_order)
      await writeFallbackBackgrounds(
        supabase,
        auth.user.id,
        fallback.overlay,
        nextList,
        fallback.backgroundRotationMinutes,
      )
      return NextResponse.json({
        success: true,
        background: {
          id: inserted.id,
          public_url: inserted.public_url,
          sort_order: inserted.sort_order,
          source: inserted.source,
          created_at: inserted.created_at,
        },
      })
    }

    return NextResponse.json({ success: true, background: insertResult.data })
  } catch (error) {
    const message = extractErrorMessage(error)
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) {
      return jsonError('Streamer Pass required', 403)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return jsonError('id is required', 400)

    const selectResult = await supabase
      .from('streamer_backgrounds')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle<{ storage_path: string }>()

    if (selectResult.error) {
      if (!isMissingStreamerBackgroundsTableMessage(selectResult.error.message)) {
        throw selectResult.error
      }
      const fallback = await readFallbackBackgrounds(supabase, auth.user.id)
      const target = fallback.backgrounds.find((item) => item.id === id)
      if (!target) return NextResponse.json({ success: true })
      if (!target.storage_path.startsWith('remote:')) {
        await supabase.storage.from(BUCKET).remove([target.storage_path])
      }
      const nextList = fallback.backgrounds
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, sort_order: index }))
      await writeFallbackBackgrounds(
        supabase,
        auth.user.id,
        fallback.overlay,
        nextList,
        fallback.backgroundRotationMinutes,
      )
      return NextResponse.json({ success: true })
    }

    const row = selectResult.data
    if (!row) return NextResponse.json({ success: true })

    if (!row.storage_path.startsWith('remote:')) {
      await supabase.storage.from(BUCKET).remove([row.storage_path])
    }
    const deleteResult = await supabase
      .from('streamer_backgrounds')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)
    if (deleteResult.error && !isMissingStreamerBackgroundsTableMessage(deleteResult.error.message)) {
      throw deleteResult.error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown delete error'
    const status = message.includes('登入') ? 401 : 500
    return jsonError(message, status)
  }
}
