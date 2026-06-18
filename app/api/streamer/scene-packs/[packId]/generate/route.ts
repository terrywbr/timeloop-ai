import { NextResponse } from 'next/server'
import {
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasCreatorToolsAccess,
} from '@/lib/supabase-server'
import { currentMonthKey, type StreamerScenePackUsageRow } from '@/lib/streamer-scene-pack'

export const runtime = 'nodejs'

const STREAMER_BACKGROUNDS_BUCKET = 'streamer-backgrounds'

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

type GenerateResponse = {
  success: true
  world: {
    id: string
    backgroundImage: string
    depthMap: string
  }
}

function varyPrompt(basePrompt: string, index: number) {
  const token = Math.random().toString(36).slice(2, 8)
  return `${basePrompt}\n\nVariation ${index + 1}, unique composition seed ${token}`
}

export async function POST(req: Request, ctx: { params: Promise<{ packId: string }> }) {
  try {
    const auth = await getAuthenticatedUser(req)
    const supabase = createSupabaseAdminClient()
    const profile = await ensureUserProfile(supabase, auth.user)
    if (!hasCreatorToolsAccess(profile)) return jsonError('Streamer Pass required', 403)

    const { packId } = await ctx.params
    const body = (await req.json()) as {
      prompt?: string
      count?: number
      particlePreset?: string
      durationSec?: number
    }
    const prompt = body.prompt?.trim()
    if (!prompt) return jsonError('prompt is required', 400)

    const count = Math.min(24, Math.max(1, Math.floor(body.count ?? 8)))
    const durationSec = Math.min(3600, Math.max(15, Math.floor(body.durationSec ?? 120)))

    const { data: pack } = await supabase
      .from('streamer_scene_packs')
      .select('id,mood_id')
      .eq('id', packId)
      .eq('user_id', auth.user.id)
      .maybeSingle<{ id: string; mood_id: string }>()
    if (!pack) return jsonError('Pack not found', 404)

    const monthKey = currentMonthKey()
    const quota = profile.streamer_monthly_quota_images ?? 300
    const { data: usageRow } = await supabase
      .from('streamer_quota_usage_monthly')
      .select('id,user_id,month_key,used_images,quota_images,updated_at')
      .eq('user_id', auth.user.id)
      .maybeSingle<StreamerScenePackUsageRow>()

    let used = 0
    let usageId: string | null = null
    if (usageRow && usageRow.month_key === monthKey) {
      used = usageRow.used_images
      usageId = usageRow.id
    }
    const remaining = Math.max(0, quota - used)
    if (remaining < count) {
      return jsonError(`Streamer quota exceeded: remaining ${remaining}, requested ${count}`, 402)
    }

    const origin = new URL(req.url).origin
    const generationResults: Array<{ imageUrl: string; storagePath: string; durationSec: number }> = []

    for (let i = 0; i < count; i += 1) {
      const genRes = await fetch(`${origin}/api/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: varyPrompt(prompt, i),
          particlePreset: body.particlePreset ?? 'cyberpunk',
        }),
      })
      const genPayload = (await genRes.json()) as GenerateResponse | { success: false; error: string }
      if (!genRes.ok || !('success' in genPayload) || !genPayload.success) {
        throw new Error(
          `Failed to generate image ${i + 1}: ${
            'error' in genPayload ? genPayload.error : `status ${genRes.status}`
          }`,
        )
      }

      const upstream = await fetch(genPayload.world.backgroundImage)
      if (!upstream.ok) {
        throw new Error(`Failed to download generated image ${i + 1} (${upstream.status})`)
      }
      const fileBuffer = Buffer.from(await upstream.arrayBuffer())
      const storagePath = `${auth.user.id}/pack-${packId}-${Date.now()}-${i}.jpg`
      const { error: uploadError } = await supabase.storage
        .from(STREAMER_BACKGROUNDS_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from(STREAMER_BACKGROUNDS_BUCKET).getPublicUrl(storagePath)
      generationResults.push({
        imageUrl: publicData.publicUrl,
        storagePath,
        durationSec,
      })
    }

    const { count: existingCount } = await supabase
      .from('streamer_scene_pack_items')
      .select('id', { head: true, count: 'exact' })
      .eq('pack_id', packId)
    const baseOrder = existingCount ?? 0

    const rows = generationResults.map((result, index) => ({
      pack_id: packId,
      image_url: result.imageUrl,
      storage_path: result.storagePath,
      sort_order: baseOrder + index,
      duration_sec: result.durationSec,
      seed: `${Date.now()}-${index}`,
      prompt_snapshot: prompt,
    }))
    const { data: inserted, error: insertError } = await supabase
      .from('streamer_scene_pack_items')
      .insert(rows)
      .select('id,image_url,sort_order,duration_sec')
    if (insertError) throw insertError

    const updatedUsed = used + count
    if (!usageId) {
      const { error: usageInsertError } = await supabase.from('streamer_quota_usage_monthly').insert({
        user_id: auth.user.id,
        month_key: monthKey,
        used_images: updatedUsed,
        quota_images: quota,
      })
      if (usageInsertError) throw usageInsertError
    } else {
      const { error: usageUpdateError } = await supabase
        .from('streamer_quota_usage_monthly')
        .update({
          month_key: monthKey,
          used_images: updatedUsed,
          quota_images: quota,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usageId)
      if (usageUpdateError) throw usageUpdateError
    }

    return NextResponse.json({
      success: true,
      generated: (inserted ?? []).map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        sortOrder: item.sort_order,
        durationSec: item.duration_sec,
      })),
      usage: {
        monthKey,
        quotaImages: quota,
        usedImages: updatedUsed,
        remainingImages: Math.max(0, quota - updatedUsed),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generate scene pack images error'
    const status = message.includes('登入') ? 401 : message.includes('quota') ? 402 : 500
    return jsonError(message, status)
  }
}
