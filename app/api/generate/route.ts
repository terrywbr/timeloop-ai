import { NextResponse } from 'next/server'
import {
  createSignedStorageUrl,
  createSupabaseAdminClient,
  ensureUserProfile,
  getAuthenticatedUser,
  hasVipAccess,
  uploadRemoteAssetToStorage,
} from '@/lib/supabase-server'
import type { GeneratedWorldRow } from '@/lib/supabase-types'

export const runtime = 'nodejs'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations'
const TOGETHER_CHAT_API_URL = 'https://api.together.xyz/v1/chat/completions'
const REPLICATE_PREDICTIONS_URL = 'https://api.replicate.com/v1/predictions'
const IMAGE_MODEL = process.env.TOGETHER_IMAGE_MODEL ?? 'black-forest-labs/FLUX.2-dev'
const IMAGE_STEPS = Number.parseInt(process.env.TOGETHER_IMAGE_STEPS ?? '20', 10)
const IMAGE_GUIDANCE = Number.parseFloat(process.env.TOGETHER_IMAGE_GUIDANCE ?? '4')
const DEFAULT_PROMPT_REWRITE_MODELS = [
  'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
]
/** Pinned version for adirik/marigold (grayscale depth map is output[0]). */
const DEPTH_MODEL_VERSION =
  '1a363593bc4882684fc58042d19db5e13a810e44e02f8d4c32afd1eb30464818'
const PROMPT_SUFFIX =
  ', 16:9 aspect ratio, immersive cinematic environment wallpaper, spectacular production design, strong foreground midground background depth, dramatic scale, hyper-detailed, masterpiece, no text, no watermark'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 60

type SceneKey = 'cyberpunk' | 'nature' | 'space' | 'ocean' | 'city' | 'desert'

const LOCALIZED_TEXT_PATTERN = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/

type GenerateRequestBody = {
  prompt?: string
  particlePreset?: string
}

type TogetherImageResponse = {
  data?: Array<{ url?: string; b64_json?: string }>
  error?: { message?: string }
}

type TogetherChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: { message?: string }
}

type ReplicatePrediction = {
  id?: string
  status?: string
  output?: string | string[] | Record<string, unknown> | null
  error?: string | null
  detail?: string | unknown
  title?: string
}

type GeneratedWorld = {
  id: string
  title: string
  backgroundImage: string
  depthMap: string
  particlePreset: string
}

type GenerateSuccessResponse = {
  success: true
  world: GeneratedWorld
}

type GenerateErrorResponse = {
  success: false
  error: string
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function jsonError(message: string, status: number) {
  const body: GenerateErrorResponse = { success: false, error: message }
  return NextResponse.json(body, { status })
}

function normalizePromptText(value: string) {
  return value
    .trim()
    .replace(/^```(?:text|json)?/i, '')
    .replace(/```$/i, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getPromptRewriteModels() {
  const configuredModels = process.env.TOGETHER_PROMPT_MODEL
    ?.split(',')
    .map((model) => model.trim())
    .filter(Boolean)

  return configuredModels && configuredModels.length > 0
    ? configuredModels
    : DEFAULT_PROMPT_REWRITE_MODELS
}

function imageGenerationOptions(prompt: string) {
  const body: Record<string, unknown> = {
    model: IMAGE_MODEL,
    prompt: `${prompt}${PROMPT_SUFFIX}`,
    width: 1024,
    height: 576,
    steps: Number.isFinite(IMAGE_STEPS) ? IMAGE_STEPS : 20,
    n: 1,
    response_format: 'url',
  }

  if (Number.isFinite(IMAGE_GUIDANCE)) {
    body.guidance = IMAGE_GUIDANCE
  }

  return body
}

function getMissingApiKeys() {
  const missing: string[] = []
  if (!readEnv('TOGETHER_API_KEY')) missing.push('TOGETHER_API_KEY')
  if (!readEnv('REPLICATE_API_TOKEN')) missing.push('REPLICATE_API_TOKEN')
  if (!readEnv('NEXT_PUBLIC_SUPABASE_URL')) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!readEnv('SUPABASE_SERVICE_ROLE_KEY')) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  return missing
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

function formatPipelineError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (/invalid api key/i.test(message)) {
    return 'Supabase 或 Together API 金鑰無效。請到 Cloudflare Worker → Variables and Secrets 重新貼上 sb_secret_ / tgp_v1_ 金鑰（前後勿有空格），或改用 Supabase 舊版 service_role JWT。'
  }
  if (/cpu time limit|exceeded.*cpu|1102|worker exceeded/i.test(message)) {
    return 'Cloudflare Workers CPU 時間不足。AI 生圖需要 Workers Paid 方案（約 $5/月），並在 wrangler.jsonc 啟用 cpu_ms: 300000 後重新部署。'
  }
  if (/timed out|timeout|ETIMEDOUT/i.test(message)) {
    return `生圖逾時：${message}。若使用 Workers Free，請升級 Workers Paid 後再試。`
  }
  return message
}

function replicateErrorMessage(payload: ReplicatePrediction, status: number, fallback: string) {
  if (status === 402) {
    return 'Replicate 額度不足，請至 https://replicate.com/account/billing 充值後再試（需與 Together AI 分開充值）。'
  }
  if (status === 429) {
    return 'Replicate 請求過於頻繁，請稍候 30 秒後再試。'
  }
  if (typeof payload.detail === 'string' && payload.detail.length > 0) return payload.detail
  if (typeof payload.title === 'string' && typeof payload.detail === 'string') {
    return `${payload.title}: ${payload.detail}`
  }
  if (typeof payload.error === 'string' && payload.error.length > 0) return payload.error
  if (payload.detail && typeof payload.detail === 'object') {
    return JSON.stringify(payload.detail)
  }
  return fallback
}

function extractTogetherImageUrl(payload: TogetherImageResponse): string {
  const first = payload.data?.[0]
  if (first?.url && typeof first.url === 'string') return first.url
  throw new Error('Together AI response did not include a valid image URL')
}

function extractReplicateOutputUrl(output: ReplicatePrediction['output']): string {
  if (typeof output === 'string' && output.length > 0) return output

  if (Array.isArray(output)) {
    const grayscaleDepth = output[0]
    if (typeof grayscaleDepth === 'string' && grayscaleDepth.length > 0) return grayscaleDepth
    const url = output.find((item) => typeof item === 'string' && item.length > 0)
    if (url) return url
  }

  if (output && typeof output === 'object') {
    const depthPng = (output as Record<string, unknown>).depth_png
    if (typeof depthPng === 'string' && depthPng.length > 0) return depthPng
    const image = (output as Record<string, unknown>).image
    if (typeof image === 'string' && image.length > 0) return image
  }

  throw new Error('Replicate response did not include a valid depth map URL')
}

function resolveParticlePreset(value: string): SceneKey {
  const presets: SceneKey[] = ['cyberpunk', 'nature', 'space', 'ocean', 'city', 'desert']
  return presets.includes(value as SceneKey) ? (value as SceneKey) : 'cyberpunk'
}

function buildImagePrompt(userPrompt: string): string {
  const containsLocalizedText = LOCALIZED_TEXT_PATTERN.test(userPrompt)

  return [
    `User requested visual concept: "${userPrompt}"`,
    'Create a single immersive environment wallpaper based only on that user request',
    containsLocalizedText
      ? 'Translate the multilingual source text semantically; do not use its script or language as a cultural, national, or architectural style cue'
      : 'Use globally understandable visual design unless a specific culture or location is explicitly requested',
    'The selected UI effect preset controls only particles and ambient rendering after generation; it must not affect subject, location, architecture, era, or culture',
    'Do not add cyberpunk, neon skyline, modern skyscrapers, or sci-fi city elements unless the user explicitly asks for them',
    'Do not add East Asian architecture, Chinese scenery, temples, pagodas, or traditional curved roofs unless the user explicitly asks for them',
  ].join('. ')
}

async function rewriteImagePromptWithModel(
  userPrompt: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch(TOGETHER_CHAT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 260,
      messages: [
        {
          role: 'system',
          content: [
            'You rewrite multilingual user requests into English prompts for an image generation model.',
            'Return only one polished English image prompt, no markdown, no JSON, no explanation.',
            'Preserve the exact subject, action, location, era, culture, and style explicitly requested by the user.',
            'Never infer culture, architecture, country, or visual style from the language or script used by the user.',
            'Do not add cyberpunk, neon, skyscrapers, modern city, East Asian architecture, Chinese scenery, temples, pagodas, or traditional curved roofs unless explicitly requested.',
            'If the user asks for a future, futuristic, sci-fi, ancient, fantasy, ruined, underwater, space, apocalyptic, magical, or other era/style modifier, make that modifier visually unmistakable through architecture, materials, technology, lighting, environment, scale, and storytelling details.',
            'Avoid weak rewrites like "after the year 3000"; describe what has visibly changed in the world.',
            'Make the prompt suitable for a high-impact 16:9 immersive environment wallpaper with cinematic depth, no text, no watermark.',
          ].join(' '),
        },
        {
          role: 'user',
          content: `Rewrite this image request into English for image generation:\n${userPrompt}`,
        },
      ],
    }),
  })

  const payload = (await response.json()) as TogetherChatResponse

  if (!response.ok) {
    const message = payload.error?.message ?? `Together AI prompt rewrite failed with status ${response.status}`
    throw new Error(message)
  }

  const rewrittenPrompt = normalizePromptText(payload.choices?.[0]?.message?.content ?? '')
  if (!rewrittenPrompt) {
    throw new Error('Together AI prompt rewrite returned an empty prompt')
  }

  return [
    rewrittenPrompt,
    'The UI visual effect preset must not change the subject, location, architecture, era, culture, or action',
    'Use the prompt semantics only; do not use the input language as a style cue',
  ].join('. ')
}

async function rewriteImagePrompt(userPrompt: string, apiKey: string): Promise<string> {
  const errors: string[] = []

  for (const model of getPromptRewriteModels()) {
    try {
      return await rewriteImagePromptWithModel(userPrompt, apiKey, model)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${model}: ${message}`)
      console.warn(`[api/generate] Prompt rewrite failed with ${model}:`, error)
    }
  }

  throw new Error(errors.join(' | '))
}

async function generateBackgroundImage(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(TOGETHER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...imageGenerationOptions(prompt),
    }),
  })

  const payload = (await response.json()) as TogetherImageResponse

  if (!response.ok) {
    const message = payload.error?.message ?? `Together AI request failed with status ${response.status}`
    throw new Error(message)
  }

  return extractTogetherImageUrl(payload)
}

async function createDepthPrediction(imageUrl: string, apiToken: string): Promise<string> {
  const response = await fetch(REPLICATE_PREDICTIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: DEPTH_MODEL_VERSION,
      input: {
        image: imageUrl,
        resize_input: true,
        num_infer: 1,
        denoise_steps: 4,
        reduction_method: 'median',
        regularizer_strength: 0.02,
        max_iter: 5,
      },
    }),
  })

  const payload = (await response.json()) as ReplicatePrediction

  if (!response.ok) {
    const fallback = `Replicate depth prediction failed with status ${response.status}`
    throw new Error(replicateErrorMessage(payload, response.status, fallback))
  }

  if (!payload.id) {
    throw new Error('Replicate response did not include a prediction ID')
  }

  return payload.id
}

async function pollDepthPrediction(predictionId: string, apiToken: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS)

    const response = await fetch(`${REPLICATE_PREDICTIONS_URL}/${predictionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    const payload = (await response.json()) as ReplicatePrediction

    if (!response.ok) {
      const fallback = `Replicate status check failed with status ${response.status}`
      throw new Error(replicateErrorMessage(payload, response.status, fallback))
    }

    if (payload.status === 'succeeded') {
      return extractReplicateOutputUrl(payload.output)
    }

    if (payload.status === 'failed' || payload.status === 'canceled') {
      throw new Error(
        replicateErrorMessage(payload, response.status, `Replicate depth generation ${payload.status ?? 'failed'}`),
      )
    }
  }

  throw new Error(
    `Replicate depth generation timed out after ${MAX_POLL_ATTEMPTS} polling attempts (~${Math.round((MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000)}s)`,
  )
}

export async function POST(req: Request) {
  try {
    const missingKeys = getMissingApiKeys()
    if (missingKeys.length > 0) {
      return jsonError(`Missing required API credentials: ${missingKeys.join(', ')}`, 401)
    }

    const togetherApiKey = readEnv('TOGETHER_API_KEY') as string
    const replicateApiToken = readEnv('REPLICATE_API_TOKEN') as string
    const supabase = createSupabaseAdminClient()
    let auth
    try {
      auth = await getAuthenticatedUser(req)
    } catch (error) {
      const message = error instanceof Error ? error.message : '請先登入後再使用此功能。'
      return jsonError(message, 401)
    }
    const profile = await ensureUserProfile(supabase, auth.user)
    const isVip = hasVipAccess(profile)

    if (!isVip && profile.remaining_credits <= 0) {
      return jsonError('本月免費生成點數已用完，請升級 VIP 或購買點數包。', 402)
    }

    let body: GenerateRequestBody
    try {
      body = (await req.json()) as GenerateRequestBody
    } catch {
      return jsonError('Invalid JSON request body', 400)
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) {
      return jsonError('Missing required field: prompt', 400)
    }

    const particlePreset = resolveParticlePreset(
      typeof body.particlePreset === 'string' && body.particlePreset.trim().length > 0
        ? body.particlePreset.trim()
        : 'cyberpunk',
    )
    let imagePrompt: string
    try {
      imagePrompt = await rewriteImagePrompt(prompt, togetherApiKey)
    } catch (error) {
      console.warn('[api/generate] All prompt rewrite models failed:', error)
      if (LOCALIZED_TEXT_PATTERN.test(prompt)) {
        return jsonError(
          '多語言提示詞需要先由文字模型改寫成英文後才能穩定生成；目前 Together AI 文字改寫不可用，請稍後再試或設定可用的 TOGETHER_PROMPT_MODEL。',
          502,
        )
      }
      imagePrompt = buildImagePrompt(prompt)
    }

    console.info('[api/generate] Step 1/2: Together AI background generation started', {
      prompt: imagePrompt,
    })
    const bgUrl = await generateBackgroundImage(imagePrompt, togetherApiKey)
    console.info('[api/generate] Step 1/2: Together AI background ready')

    console.info('[api/generate] Step 2/2: Replicate depth generation started')
    const predictionId = await createDepthPrediction(bgUrl, replicateApiToken)
    const depthUrl = await pollDepthPrediction(predictionId, replicateApiToken)
    console.info('[api/generate] Step 2/2: Replicate depth map ready')

    console.info('[api/generate] Step 3/4: Supabase asset persistence started')
    const worldId = crypto.randomUUID()
    const safeTimestamp = Date.now()
    const backgroundPath = `${auth.user.id}/${worldId}-${safeTimestamp}-bg.jpg`
    const depthPath = `${auth.user.id}/${worldId}-${safeTimestamp}-depth.png`

    await uploadRemoteAssetToStorage({
      supabase,
      sourceUrl: bgUrl,
      bucket: 'generated-backgrounds',
      path: backgroundPath,
      contentType: 'image/jpeg',
    })
    await uploadRemoteAssetToStorage({
      supabase,
      sourceUrl: depthUrl,
      bucket: 'generated-depths',
      path: depthPath,
      contentType: 'image/png',
    })
    console.info('[api/generate] Step 3/4: Supabase asset persistence ready')

    console.info('[api/generate] Step 4/4: Supabase world metadata started')
    const { data: worldRow, error: worldError } = await supabase
      .from('generated_worlds')
      .insert({
        id: worldId,
        user_id: auth.user.id,
        prompt,
        rewritten_prompt: imagePrompt,
        title: prompt,
        background_image: backgroundPath,
        depth_map: depthPath,
        storage_background_path: backgroundPath,
        storage_depth_path: depthPath,
        particle_preset: particlePreset,
        width: 1024,
        height: 576,
        quality: 'high',
        is_featured: false,
        is_private: true,
      })
      .select('*')
      .single<GeneratedWorldRow>()

    if (worldError) throw worldError

    let balanceAfter = profile.remaining_credits
    if (!isVip) {
      balanceAfter = Math.max(0, profile.remaining_credits - 1)
      const { error: creditUpdateError } = await supabase
        .from('users')
        .update({ remaining_credits: balanceAfter })
        .eq('id', auth.user.id)

      if (creditUpdateError) throw creditUpdateError

      const { error: creditTransactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: auth.user.id,
          amount: -1,
          balance_after: balanceAfter,
          type: 'generation',
          source: 'generation',
          metadata: {
            generated_world_id: worldId,
            prompt,
          },
        })

      if (creditTransactionError) throw creditTransactionError
    }
    console.info('[api/generate] Step 4/4: Supabase world metadata ready')

    const signedBackgroundUrl = await createSignedStorageUrl(
      supabase,
      'generated-backgrounds',
      worldRow.storage_background_path,
    )
    const signedDepthUrl = await createSignedStorageUrl(
      supabase,
      'generated-depths',
      worldRow.storage_depth_path,
    )

    const world: GeneratedWorld = {
      id: worldId,
      title: prompt,
      backgroundImage: signedBackgroundUrl,
      depthMap: signedDepthUrl,
      particlePreset,
    }

    return NextResponse.json({
      success: true,
      world,
    } satisfies GenerateSuccessResponse)
  } catch (error) {
    const message = formatPipelineError(error)
    console.error('[api/generate] Pipeline failed:', error)
    return jsonError(message, 500)
  }
}

export async function GET() {
  return jsonError('Method not allowed. Use POST.', 405)
}
