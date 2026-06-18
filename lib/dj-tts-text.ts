/** Edge TTS stays reliable under ~500 chars; longer Thai/Vietnamese lines often time out. */
export const MAX_EDGE_TTS_CHARS = 480

const SENTENCE_END_RE = /[.!?…。！？]\s*/g

export function truncateTextForEdgeTts(text: string, maxChars = MAX_EDGE_TTS_CHARS): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return trimmed

  const slice = trimmed.slice(0, maxChars)
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('！'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
    slice.lastIndexOf('…'),
  )
  if (lastSentenceEnd >= Math.floor(maxChars * 0.45)) {
    return slice.slice(0, lastSentenceEnd + 1).trim()
  }

  const lastSpace = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('　'))
  if (lastSpace >= Math.floor(maxChars * 0.55)) {
    return slice.slice(0, lastSpace).trim()
  }

  return slice.trim()
}
