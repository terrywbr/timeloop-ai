const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek-chat'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type DeepSeekChatResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/^["'「『]|["'」』]$/g, '')
    .replace(/^```(?:text)?/i, '')
    .replace(/```$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isDeepSeekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim())
}

export function getDeepSeekModel() {
  return process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL
}

export async function deepSeekChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; timeoutMs?: number },
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? 12_000
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(DEEPSEEK_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getDeepSeekModel(),
        temperature: options?.temperature ?? 0.92,
        max_tokens: options?.maxTokens ?? 320,
        messages,
      }),
      signal: controller.signal,
    })

    const payload = (await response.json()) as DeepSeekChatResponse
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `DeepSeek chat failed (${response.status})`)
    }

    const text = normalizeText(payload.choices?.[0]?.message?.content ?? '')
    if (!text) throw new Error('DeepSeek returned empty content')
    return text
  } finally {
    clearTimeout(timer)
  }
}
