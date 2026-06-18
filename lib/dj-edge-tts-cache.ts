import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { synthesizeEdgeSpeech } from '@/lib/edge-tts'
import { resolveEdgeVoice } from '@/lib/dj-edge-voices'
import type { MusicMoodId } from '@/lib/music-moods'
import type { Language } from '@/lib/translations'

export const EDGE_TTS_CACHE_BUCKET = 'dj-tts-cache'

export type ResolvedEdgeTtsAudio = {
  cacheHit: boolean
  cacheKey: string
  storagePath: string
  audioUrl: string
}

/**
 * Edge TTS cache is available when Supabase is configured.
 * Edge TTS itself needs no API key — it's Microsoft's public service.
 */
export function isEdgeTtsCacheable(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  )
}

function readSupabasePublicUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return url.replace(/\/$/, '')
}

export function computeEdgeTtsCacheKey(text: string, moodId: MusicMoodId, locale: Language): string {
  const voice = resolveEdgeVoice(moodId, locale)
  const payload = `edge|${voice.voice}|${voice.rate ?? ''}|${voice.pitch ?? ''}|${text.trim()}`
  return createHash('md5').update(payload, 'utf8').digest('hex')
}

export function getEdgeTtsPublicUrl(storagePath: string): string {
  return `${readSupabasePublicUrl()}/storage/v1/object/public/${EDGE_TTS_CACHE_BUCKET}/${storagePath}`
}

async function isCacheHit(storagePath: string): Promise<boolean> {
  const url = getEdgeTtsPublicUrl(storagePath)
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

async function uploadToCache(
  supabase: SupabaseClient,
  storagePath: string,
  audio: ArrayBuffer,
): Promise<void> {
  const { error } = await supabase.storage.from(EDGE_TTS_CACHE_BUCKET).upload(storagePath, audio, {
    contentType: 'audio/mpeg',
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error
}

export async function resolveTtsWithEdgeCache(
  text: string,
  moodId: MusicMoodId,
  locale: Language,
): Promise<ResolvedEdgeTtsAudio> {
  const cacheKey = computeEdgeTtsCacheKey(text, moodId, locale)
  const storagePath = `edge-${cacheKey}.mp3`
  const audioUrl = getEdgeTtsPublicUrl(storagePath)

  if (await isCacheHit(storagePath)) {
    return { cacheHit: true, cacheKey, storagePath, audioUrl }
  }

  const edgeVoice = resolveEdgeVoice(moodId, locale)
  const audioBuffer = await synthesizeEdgeSpeech(text, edgeVoice)
  const supabase = createSupabaseAdminClient()
  await uploadToCache(supabase, storagePath, audioBuffer)

  return { cacheHit: false, cacheKey, storagePath, audioUrl }
}
