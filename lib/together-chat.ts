const TOGETHER_CHAT_API_URL = 'https://api.together.xyz/v1/chat/completions'

const DEFAULT_CHAT_MODELS = [
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  'meta-llama/Llama-3.3-70B-Instruct-Turbo',
]

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type TogetherChatResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/^```(?:text)?/i, '')
    .replace(/```$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getChatModels() {
  const configured = process.env.TOGETHER_PROMPT_MODEL
    ?.split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  return configured?.length ? configured : DEFAULT_CHAT_MODELS
}

export async function togetherChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; timeoutMs?: number },
): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('TOGETHER_API_KEY is not configured')
  }

  const errors: string[] = []
  const timeoutMs = options?.timeoutMs ?? 5000

  for (const model of getChatModels()) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(TOGETHER_CHAT_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 180,
          messages,
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      const payload = (await response.json()) as TogetherChatResponse
      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Chat failed (${response.status})`)
      }

      const text = normalizeText(payload.choices?.[0]?.message?.content ?? '')
      if (!text) throw new Error('Empty chat response')
      return text
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${model}: ${message}`)
    }
  }

  throw new Error(errors.join(' | '))
}
