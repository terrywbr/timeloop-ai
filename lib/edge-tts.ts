import { randomUUID } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { EdgeVoiceProfile } from '@/lib/dj-edge-voices'

import { MAX_EDGE_TTS_CHARS, truncateTextForEdgeTts } from '@/lib/dj-tts-text'

const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'
const MAX_INPUT_CHARS = MAX_EDGE_TTS_CHARS

export type EdgeTtsConfig = EdgeVoiceProfile

export function isEdgeTtsConfigured() {
  return true
}

export async function synthesizeEdgeSpeech(text: string, config: EdgeTtsConfig): Promise<ArrayBuffer> {
  const input = truncateTextForEdgeTts(text.trim(), MAX_INPUT_CHARS)
  if (!input) {
    throw new Error('Edge TTS input is empty')
  }

  const { EdgeTTS } = await import('node-edge-tts')
  const outputPath = join(tmpdir(), `dj-edge-tts-${randomUUID()}.mp3`)
  const timeoutMs = Math.min(60_000, 15_000 + input.length * 12)
  const tts = new EdgeTTS({
    voice: config.voice,
    lang: config.lang,
    outputFormat: OUTPUT_FORMAT,
    rate: config.rate,
    pitch: config.pitch,
    timeout: timeoutMs,
  })

  try {
    await tts.ttsPromise(input, outputPath)
    const file = await readFile(outputPath)
    if (file.byteLength === 0) {
      throw new Error('Edge TTS produced empty audio')
    }
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
  } finally {
    await unlink(outputPath).catch(() => {})
  }
}
