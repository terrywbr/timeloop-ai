type PlayOptions = {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

let activeAudio: HTMLAudioElement | null = null
let activeObjectUrl: string | null = null
let activeUtterance: SpeechSynthesisUtterance | null = null

function cleanupPlayback() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.src = ''
    activeAudio.onended = null
    activeAudio.onerror = null
    activeAudio.onplay = null
    activeAudio = null
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl)
    activeObjectUrl = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    activeUtterance = null
  }
}

export function isDjAudioSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    (typeof Audio !== 'undefined' || typeof window.speechSynthesis !== 'undefined')
  )
}

export function stopDjSpeech() {
  cleanupPlayback()
}

export function isDjSpeaking(): boolean {
  return activeAudio !== null && !activeAudio.paused && !activeAudio.ended
}

function playBlob(blob: Blob, options?: PlayOptions): Promise<void> {
  return new Promise((resolve) => {
    cleanupPlayback()

    activeObjectUrl = URL.createObjectURL(blob)
    const audio = new Audio(activeObjectUrl)
    activeAudio = audio

    audio.onplay = () => options?.onStart?.()
    audio.onended = () => {
      cleanupPlayback()
      options?.onEnd?.()
      resolve()
    }
    audio.onerror = () => {
      cleanupPlayback()
      options?.onError?.(new Error('Audio playback failed'))
      options?.onEnd?.()
      resolve()
    }

    void audio.play().catch((error: unknown) => {
      cleanupPlayback()
      options?.onError?.(error instanceof Error ? error : new Error('Audio play rejected'))
      options?.onEnd?.()
      resolve()
    })
  })
}

export function playDjAudioFromBase64(base64: string, options?: PlayOptions): Promise<void> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return playBlob(new Blob([bytes], { type: 'audio/mpeg' }), options)
}

export async function playDjAudioFromResponse(response: Response, options?: PlayOptions): Promise<void> {
  if (!response.ok) {
    throw new Error(`TTS request failed (${response.status})`)
  }
  const blob = await response.blob()
  return playBlob(blob, options)
}

export function playDjAudioFromUrl(url: string, options?: PlayOptions): Promise<void> {
  return new Promise((resolve) => {
    cleanupPlayback()

    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.src = url
    activeAudio = audio

    audio.onplay = () => options?.onStart?.()
    audio.onended = () => {
      cleanupPlayback()
      options?.onEnd?.()
      resolve()
    }
    audio.onerror = () => {
      cleanupPlayback()
      options?.onError?.(new Error('Audio playback failed'))
      options?.onEnd?.()
      resolve()
    }

    void audio.play().catch((error: unknown) => {
      cleanupPlayback()
      options?.onError?.(error instanceof Error ? error : new Error('Audio play rejected'))
      options?.onEnd?.()
      resolve()
    })
  })
}

export function playDjSpeechSynthesis(text: string, lang: string, options?: PlayOptions): Promise<void> {
  return new Promise((resolve) => {
    cleanupPlayback()

    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      options?.onError?.(new Error('Speech synthesis is not supported'))
      options?.onEnd?.()
      resolve()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    activeUtterance = utterance
    utterance.lang = lang
    utterance.rate = 0.92
    utterance.pitch = 0.95
    utterance.volume = 1

    const voices = window.speechSynthesis.getVoices()
    const langPrefix = lang.split('-')[0]
    const matchingVoice = voices.find((voice) => voice.lang === lang) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith(`${langPrefix.toLowerCase()}-`))
    if (matchingVoice) utterance.voice = matchingVoice

    utterance.onstart = () => options?.onStart?.()
    utterance.onend = () => {
      activeUtterance = null
      options?.onEnd?.()
      resolve()
    }
    utterance.onerror = (event) => {
      activeUtterance = null
      options?.onError?.(new Error(event.error || 'Speech synthesis failed'))
      options?.onEnd?.()
      resolve()
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}
