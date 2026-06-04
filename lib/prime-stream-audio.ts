/** Synchronous play within a user-gesture handler (iOS autoplay policy). */
let primedAudio: HTMLAudioElement | null = null

export function primeStreamAudio(streamUrl: string, volume = 70) {
  if (!streamUrl || typeof window === 'undefined') return

  if (!primedAudio) {
    primedAudio = new Audio()
    primedAudio.setAttribute('playsinline', '')
  }

  primedAudio.volume = Math.min(1, Math.max(0, volume / 100))
  primedAudio.muted = false

  const absoluteUrl = streamUrl.startsWith('http')
    ? streamUrl
    : `${window.location.origin}${streamUrl}`

  if (primedAudio.src !== absoluteUrl) {
    primedAudio.src = absoluteUrl
    primedAudio.load()
  }

  void primedAudio.play().catch(() => {})
}

export function stopPrimedStreamAudio() {
  if (!primedAudio) return
  primedAudio.pause()
  primedAudio.removeAttribute('src')
  primedAudio.load()
}
