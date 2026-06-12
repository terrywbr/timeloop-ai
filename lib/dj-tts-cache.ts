import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DjTtsProfile } from '@/lib/ai-dj-personas'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { getOpenAiTtsModelOverride, isOpenAiTtsConfigured, synthesizeOpenAiSpeech } from '@/lib/openai-tts'

export const DJ_TTS_CACHE_BUCKET = 'dj-tts-cache'

export type ResolvedTtsAudio = {
  cacheHit: boolean
  cacheKey: string
  storagePath: string
  audioUrl: string
}

function readSupabasePublicUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return url.replace(/\/$/, '')
}

/** Stable cache key: model + voice + speed + exact script text. */
export function computeTtsCacheKey(text: string, profile: DjTtsProfile): string {
  const model = getOpenAiTtsModelOverride() ?? profile.model
  const payload = `${model}|${profile.voice}|${profile.speed}|${text.trim()}`
  return createHash('md5').update(payload, 'utf8').digest('hex')
}

export function getDjTtsPublicUrl(storagePath: string): string {
  return `${readSupabasePublicUrl()}/storage/v1/object/public/${DJ_TTS_CACHE_BUCKET}/${storagePath}`
}

export async function isDjTtsCacheHit(storagePath: string): Promise<boolean> {
  const url = getDjTtsPublicUrl(storagePath)
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

export async function uploadDjTtsToCache(
  supabase: SupabaseClient,
  storagePath: string,
  audio: ArrayBuffer,
): Promise<void> {
  const { error } = await supabase.storage.from(DJ_TTS_CACHE_BUCKET).upload(storagePath, audio, {
    contentType: 'audio/mpeg',
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error
}

export async function resolveTtsWithCache(
  text: string,
  profile: DjTtsProfile,
): Promise<ResolvedTtsAudio> {
  const cacheKey = computeTtsCacheKey(text, profile)
  const storagePath = `${cacheKey}.mp3`
  const audioUrl = getDjTtsPublicUrl(storagePath)

  if (await isDjTtsCacheHit(storagePath)) {
    return { cacheHit: true, cacheKey, storagePath, audioUrl }
  }

  if (!isOpenAiTtsConfigured()) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const audioBuffer = await synthesizeOpenAiSpeech(text, profile)
  const supabase = createSupabaseAdminClient()
  await uploadDjTtsToCache(supabase, storagePath, audioBuffer)

  return { cacheHit: false, cacheKey, storagePath, audioUrl }
}
