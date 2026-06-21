/**
 * Process official gallery source images into thumbnail, background, and depth assets.
 * Depth maps use the same Replicate marigold model as app/api/generate/route.ts.
 *
 * Usage: node scripts/process-gallery-assets.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const PHOTO_DIR = join(ROOT, 'PHOTO')
const GALLERY_DIR = join(ROOT, 'public', 'gallery')

const BG_SIZE = { width: 2730, height: 1535 }
const THUMB_SIZE = { width: 683, height: 384 }

const DEPTH_MODEL_VERSION =
  '1a363593bc4882684fc58042d19db5e13a810e44e02f8d4c32afd1eb30464818'
const REPLICATE_PREDICTIONS_URL = 'https://api.replicate.com/v1/predictions'
const REPLICATE_FILES_URL = 'https://api.replicate.com/v1/files'
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90

/** Missing official gallery slots → PHOTO source files */
const JOBS = [
  { id: 's01', source: '跨時空古今萬象風景提示詞 (2).png' },
  { id: 's03', source: 'timeloop-21d78d6e-3f5b-49e3-8ec6-369c56a7cf50.jpg' },
  { id: 's07', source: '跨時空古今萬象風景提示詞.png' },
  { id: 's14', source: '跨時空古今萬象風景提示詞 (1).png' },
]

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const path = join(ROOT, name)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resizeWithPython(sourcePath, outputs) {
  const script = `
from PIL import Image
src = Image.open(r"${sourcePath.replace(/\\/g, '\\\\')}")
src = src.convert('RGB')
bg = src.resize((${BG_SIZE.width}, ${BG_SIZE.height}), Image.Resampling.LANCZOS)
thumb = src.resize((${THUMB_SIZE.width}, ${THUMB_SIZE.height}), Image.Resampling.LANCZOS)
bg.save(r"${outputs.bg.replace(/\\/g, '\\\\')}", 'JPEG', quality=92)
thumb.save(r"${outputs.thumb.replace(/\\/g, '\\\\')}", 'JPEG', quality=88)
`
  const result = spawnSync('python', ['-c', script], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Python resize failed')
  }
}

async function uploadFileToReplicate(apiToken, filePath) {
  const buffer = readFileSync(filePath)
  const filename = filePath.split(/[/\\]/).pop() ?? 'image.jpg'
  const form = new FormData()
  form.append('content', new Blob([buffer], { type: 'image/jpeg' }), filename)

  const response = await fetch(REPLICATE_FILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: form,
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.detail ?? payload.error ?? `Replicate file upload failed (${response.status})`)
  }

  const url = payload.urls?.get
  if (!url) throw new Error('Replicate file upload did not return urls.get')
  return url
}

async function createDepthPrediction(imageUrl, apiToken) {
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

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.detail ?? payload.error ?? `Replicate prediction failed (${response.status})`)
  }
  if (!payload.id) throw new Error('Replicate response missing prediction id')
  return payload.id
}

function extractOutputUrl(output) {
  if (typeof output === 'string' && output.length > 0) return output
  if (Array.isArray(output)) {
    const first = output[0]
    if (typeof first === 'string' && first.length > 0) return first
    const url = output.find((item) => typeof item === 'string' && item.length > 0)
    if (url) return url
  }
  if (output && typeof output === 'object') {
    const depthPng = output.depth_png
    if (typeof depthPng === 'string' && depthPng.length > 0) return depthPng
    const image = output.image
    if (typeof image === 'string' && image.length > 0) return image
  }
  throw new Error('Replicate output missing depth map URL')
}

async function pollDepthPrediction(predictionId, apiToken) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS)

    const response = await fetch(`${REPLICATE_PREDICTIONS_URL}/${predictionId}`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.detail ?? payload.error ?? `Replicate poll failed (${response.status})`)
    }

    if (payload.status === 'succeeded') return extractOutputUrl(payload.output)
    if (payload.status === 'failed' || payload.status === 'canceled') {
      throw new Error(payload.error ?? `Replicate depth ${payload.status}`)
    }
  }

  throw new Error('Replicate depth generation timed out')
}

async function downloadDepthAsJpeg(depthUrl, outputPath) {
  const response = await fetch(depthUrl)
  if (!response.ok) throw new Error(`Failed to download depth map (${response.status})`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const tempPng = outputPath.replace(/\.jpg$/i, '.tmp.png')
  writeFileSync(tempPng, buffer)

  const script = `
from PIL import Image
img = Image.open(r"${tempPng.replace(/\\/g, '\\\\')}").convert('RGB')
img = img.resize((${BG_SIZE.width}, ${BG_SIZE.height}), Image.Resampling.LANCZOS)
img.save(r"${outputPath.replace(/\\/g, '\\\\')}", 'JPEG', quality=90)
`
  const result = spawnSync('python', ['-c', script], { encoding: 'utf8' })
  spawnSync('python', ['-c', `import os; os.remove(r"${tempPng.replace(/\\/g, '\\\\')}")`])
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Depth JPEG conversion failed')
  }
}

async function processJob(job, apiToken) {
  const sourcePath = join(PHOTO_DIR, job.source)
  if (!existsSync(sourcePath)) throw new Error(`Source not found: ${sourcePath}`)

  const thumbPath = join(GALLERY_DIR, `${job.id}.jpg`)
  const bgPath = join(GALLERY_DIR, 'backgrounds', `${job.id}-bg.jpg`)
  const depthPath = join(GALLERY_DIR, 'depths', `${job.id}-depth.jpg`)

  console.info(`[gallery] ${job.id}: resizing ${job.source}`)
  resizeWithPython(sourcePath, { bg: bgPath, thumb: thumbPath })

  console.info(`[gallery] ${job.id}: uploading background to Replicate`)
  const imageUrl = await uploadFileToReplicate(apiToken, bgPath)

  console.info(`[gallery] ${job.id}: generating depth map (marigold)`)
  const predictionId = await createDepthPrediction(imageUrl, apiToken)
  const depthUrl = await pollDepthPrediction(predictionId, apiToken)

  console.info(`[gallery] ${job.id}: saving depth map`)
  await downloadDepthAsJpeg(depthUrl, depthPath)

  console.info(`[gallery] ${job.id}: done → ${thumbPath}`)
}

async function main() {
  loadEnv()
  const apiToken = process.env.REPLICATE_API_TOKEN?.trim()
  if (!apiToken) {
    console.error('REPLICATE_API_TOKEN is required in .env.local or .env')
    process.exit(1)
  }

  for (const job of JOBS) {
    await processJob(job, apiToken)
  }

  console.info('[gallery] All jobs completed.')
}

main().catch((error) => {
  console.error('[gallery] Failed:', error)
  process.exit(1)
})
